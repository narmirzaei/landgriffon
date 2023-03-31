tf_state_bucket    = "releaf-landgriffon-tf-state-bucket"
bucket             = "releaf-landgriffon-raw-data"
environment        = "dev"
allowed_account_id = "120080726340"
domain             = "landgriffon.com"
repo_name          = "landgriffon"
aws_region         = "eu-central-1"
project_name       = "releaf"

environments = {
  dev : {
    api_env_vars : [],
		load_fresh_data : true,
		data_import_arguments : ["seed-data"],
		image_tag : "dev",
    aws_region: "eu-central-1"
  },
  test : {},
  tetrapack : {
  },
  demo : {}
}
