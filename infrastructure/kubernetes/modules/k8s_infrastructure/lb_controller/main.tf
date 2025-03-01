locals {
  alb_controller_helm_repo     = "https://aws.github.io/eks-charts"
  alb_controller_chart_name    = "aws-load-balancer-controller"
  alb_controller_chart_version = var.aws_load_balancer_controller_chart_version
  aws_alb_ingress_class        = "alb"
  aws_vpc_id                   = data.aws_vpc.selected.id
  aws_region_name              = var.aws_region
}

data "aws_eks_cluster" "selected" {
  name = var.cluster_name
}

data "aws_vpc" "selected" {
  id = data.aws_eks_cluster.selected.vpc_config[0].vpc_id
}

data "aws_region" "current" {
  name = var.aws_region
}

data "aws_caller_identity" "current" {}

# Authentication data for that cluster
data "aws_eks_cluster_auth" "selected" {
  name = var.cluster_name
}

data "aws_iam_policy_document" "eks_oidc_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    condition {
      test     = "StringEquals"
      variable = "${replace(data.aws_eks_cluster.selected.identity[0].oidc[0].issuer, "https://", "")}:sub"
      values = [
        "system:serviceaccount:${var.k8s_namespace}:aws-load-balancer-controller"
      ]
    }
    principals {
      identifiers = [
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${replace(data.aws_eks_cluster.selected.identity[0].oidc[0].issuer, "https://", "")}"
      ]
      type = "Federated"
    }
  }
}

resource "aws_iam_role" "lb-controller-iam-role" {
  name        = "${var.cluster_name}-aws-load-balancer-controller"
  description = "Permissions required by the Kubernetes AWS Load Balancer controller to do its job."

  force_detach_policies = true

  assume_role_policy = data.aws_iam_policy_document.eks_oidc_assume_role.json
}

data "aws_iam_policy_document" "lb-controller-iam-policy-document" {
  #  source_json = file("${path.module}/iam_policy.json")
  source_policy_documents = [
    file("${path.module}/iam_policy.json")
  ]
}

resource "aws_iam_policy" "lb-controller-iam-policy" {
  name        = "${var.cluster_name}-alb-management"
  description = "Permissions that are required to manage AWS Application Load Balancers."

  policy = data.aws_iam_policy_document.lb-controller-iam-policy-document.json
}

resource "aws_iam_role_policy_attachment" "lb-controller-iam-role-policy-attachment" {
  policy_arn = aws_iam_policy.lb-controller-iam-policy.arn
  role       = aws_iam_role.lb-controller-iam-role.name
}

resource "kubernetes_service_account" "this" {
  automount_service_account_token = true
  metadata {
    name      = "aws-load-balancer-controller"
    namespace = var.k8s_namespace
    annotations = {
      # This annotation is only used when running on EKS which can
      # use IAM roles for service accounts.
      "eks.amazonaws.com/role-arn" = aws_iam_role.lb-controller-iam-role.arn
    }
    labels = {
      "app.kubernetes.io/name"       = "aws-load-balancer-controller"
      "app.kubernetes.io/component"  = "controller"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }
}

resource "kubernetes_cluster_role" "this" {
  metadata {
    name = "aws-load-balancer-controller"

    labels = {
      "app.kubernetes.io/name"       = "aws-load-balancer-controller"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  rule {
    api_groups = [
      "",
      "extensions",
    ]

    resources = [
      "configmaps",
      "endpoints",
      "events",
      "ingresses",
      "ingresses/status",
      "services",
    ]

    verbs = [
      "create",
      "get",
      "list",
      "update",
      "watch",
      "patch",
    ]
  }

  rule {
    api_groups = [
      "",
      "extensions",
    ]

    resources = [
      "nodes",
      "pods",
      "secrets",
      "services",
      "namespaces",
    ]

    verbs = [
      "get",
      "list",
      "watch",
    ]
  }
}

resource "kubernetes_cluster_role_binding" "this" {
  metadata {
    name = "aws-load-balancer-controller"

    labels = {
      "app.kubernetes.io/name"       = "aws-load-balancer-controller"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.this.metadata[0].name
  }

  subject {
    api_group = ""
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.this.metadata[0].name
    namespace = kubernetes_service_account.this.metadata[0].namespace
  }
}

resource "helm_release" "alb_controller" {
  name       = "aws-load-balancer-controller"
  repository = local.alb_controller_helm_repo
  chart      = local.alb_controller_chart_name
  version    = local.alb_controller_chart_version
  namespace  = var.k8s_namespace
  atomic     = true
  timeout    = 900

  dynamic "set" {
    for_each = {
      "clusterName"           = var.cluster_name
      "serviceAccount.create" = false
      "serviceAccount.name"   = kubernetes_service_account.this.metadata[0].name
      "region"                = local.aws_region_name
      "vpcId"                 = local.aws_vpc_id
      "image.tag"             = var.aws_load_balancer_controller_version
      "replicaCount"          = 1
    }
    content {
      name  = set.key
      value = set.value
    }
  }

}

# Generate a kubeconfig file for the EKS cluster to use in provisioners
data "template_file" "kubeconfig" {
  template = <<-EOF
    apiVersion: v1
    kind: Config
    current-context: terraform
    clusters:
    - name: ${data.aws_eks_cluster.selected.name}
      cluster:
        certificate-authority-data: ${data.aws_eks_cluster.selected.certificate_authority.0.data}
        server: ${data.aws_eks_cluster.selected.endpoint}
    contexts:
    - name: terraform
      context:
        cluster: ${data.aws_eks_cluster.selected.name}
        user: terraform
    users:
    - name: terraform
      user:
        token: ${data.aws_eks_cluster_auth.selected.token}
  EOF
}

# Since the kubernetes_provider cannot yet handle CRDs, we need to set any
# supplied TargetGroupBinding using a null_resource.
#
# The method used below for securely specifying the kubeconfig to provisioners
# without spilling secrets into the logs comes from:
# https://medium.com/citihub/a-more-secure-way-to-call-kubectl-from-terraform-1052adf37af8

resource "null_resource" "supply_target_group_arns" {
  count = (length(var.target_groups) > 0) ? length(var.target_groups) : 0
  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    environment = {
      KUBECONFIG = base64encode(data.template_file.kubeconfig.rendered)
    }
    command = <<-EOF
      cat <<YAML | kubectl -n ${var.k8s_namespace} --kubeconfig <(echo $KUBECONFIG | base64 --decode) apply -f -
      apiVersion: elbv2.k8s.aws/v1beta1
      kind: TargetGroupBinding
      metadata:
        name: ${lookup(var.target_groups[count.index], "name", "")}-tgb
      spec:
        serviceRef:
          name: ${lookup(var.target_groups[count.index], "name", "")}
          port: ${lookup(var.target_groups[count.index], "backend_port", "")}
        targetGroupARN: ${lookup(var.target_groups[count.index], "target_group_arn", "")}
      YAML
    EOF
  }
  depends_on = [helm_release.alb_controller]
}
