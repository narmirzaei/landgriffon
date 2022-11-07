import type { Option } from 'components/forms/select/types';
import type { GroupBase, Props } from 'react-select';

export type SelectOption<T = string> = Option<T>;

type Styles = Readonly<{
  border: boolean;
}>;

export interface SelectProps<OptionValue = string, IsMulti extends boolean = false>
  extends Omit<
    Props<Option<OptionValue>, IsMulti, GroupBase<Option<OptionValue>>>,
    'value' | 'isSearchable' | 'label' | 'placeholder' | 'isClearable' | 'isLoading' | 'isDisabled'
  > {
  instanceId?: number | string;
  showSearch?: boolean;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  current?: Props<Option<OptionValue>, IsMulti, GroupBase<Option<OptionValue>>>['value'];
  allowEmpty?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
  onChange?: (selected: Option<OptionValue>) => unknown;
  onSearch?: (query: string) => unknown;
  theme?: 'default' | 'default-bordernone' | 'inline-primary';
  error?: boolean;
  hideValueWhenMenuOpen?: boolean;
  numeric?: boolean;
}
