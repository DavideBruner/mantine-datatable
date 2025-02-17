import type { DefaultProps, MantineShadow, MantineTheme, Sx, TableProps } from '@mantine/core';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import type { DataTableCellClickHandler } from './DataTableCellClickHandler';
import type { DataTableColumn } from './DataTableColumn';
import type { DataTableContextMenuProps } from './DataTableContextMenuProps';
import type { DataTableEmptyStateProps } from './DataTableEmptyStateProps';
import type { DataTableLoaderProps } from './DataTableLoaderProps';
import type { DataTableOuterBorderProps } from './DataTableOuterBorderProps';
import type { DataTablePaginationProps } from './DataTablePaginationProps';
import type { DataTableRowExpansionProps } from './DataTableRowExpansionProps';
import type { DataTableSelectionProps } from './DataTableSelectionProps';
import type { DataTableSortProps } from './DataTableSortProps';
import type { DataTableVerticalAlignment } from './DataTableVerticalAlignment';

export type DataTableProps<T> = {
  /**
   * Table height; defaults to `100%`
   */
  height?: string | number;

  /**
   * Minimum table height
   */
  minHeight?: string | number;

  /**
   * `DataTable` component shadow
   */
  shadow?: MantineShadow;

  /**
   * If true, columns will have vertical borders
   */
  withColumnBorders?: boolean;

  /**
   * Table border color, applied to the outer border, the header bottom border, and the pagination
   * footer top border; defaults to
   * `(theme) => (theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3])`
   */
  borderColor?: string | ((theme: MantineTheme) => string);

  /**
   * Row border color; defaults to
   * `(theme) => (theme.fn.rgba(theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3], 0.65))`
   */
  rowBorderColor?: string | ((theme: MantineTheme) => string);

  /**
   * If true, the user will not be able to select text
   */
  textSelectionDisabled?: boolean;

  /**
   * Vertical alignment for row cells; defaults to `center`
   */
  verticalAlignment?: DataTableVerticalAlignment;

  /**
   * If true, will show a loader with semi-transparent background, centered over the table
   */
  fetching?: boolean;

  /**
   * Visible columns
   */
  columns: DataTableColumn<T>[];

  /**
   * A default render function for all columns; accepts the current record, its index in `records`
   * and the column accessor
   */
  defaultColumnRender?: (record: T, index: number, accesor: string) => ReactNode;

  /**
   * Accessor to use as unique record key; you can use dot-notation for nested objects property drilling
   * (i.e. `department.name` or `department.company.name`);
   * defaults to `id`
   */
  idAccessor?: string;

  /**
   * Visible records; the `DataTable` component will try to infer its row type from here
   */
  records?: T[];

  /**
   * Text to show on empty state and pagination footer when no records are available
   */
  noRecordsText?: string;

  /**
   * Function to call when a row cell is clicked
   */
  onCellClick?: DataTableCellClickHandler<T>;

  /**
   * Function to call when a row is clicked, accepting the current record and its index in `records`
   */
  onRowClick?: (record: T, recordIndex: number) => void;

  /**
   * Defines a context-menu to show when user right-clicks or clicks on a row
   */
  rowContextMenu?: DataTableContextMenuProps<T>;

  /**
   * Defines the row expansion behavior
   */
  rowExpansion?: DataTableRowExpansionProps<T>;

  /**
   * Optional class name passed to each row; can be a string or a function
   * receiving the current record and its index as arguments and returning a string
   */
  rowClassName?: string | ((record: T, recordIndex: number) => string | undefined);

  /**
   * Optional style passed to each row; can be a CSS properties object or
   * a function receiving the current record and its index as arguments and returning a CSS properties object
   */
  rowStyle?: CSSProperties | ((record: T, recordIndex: number) => CSSProperties | undefined);

  /**
   * Optional style passed to each row; see https://mantine.dev/styles/sx/
   */
  rowSx?: Sx;

  /**
   * Optional function returning an object of custom attributes to be applied to each row in the table
   */
  customRowAttributes?: (record: T, recordIndex: number) => Record<string, string | number>;

  /**
   * Ref pointing to the table body element
   */
  bodyRef?: ((instance: HTMLTableSectionElement | null) => void) | RefObject<HTMLTableSectionElement>;
} & Pick<TableProps, 'striped' | 'highlightOnHover' | 'horizontalSpacing' | 'verticalSpacing' | 'fontSize'> &
  Omit<
    DefaultProps<'root' | 'header' | 'pagination', CSSProperties>,
    'unstyled' | 'p' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr'
  > &
  DataTableOuterBorderProps &
  DataTableLoaderProps &
  DataTableEmptyStateProps &
  DataTablePaginationProps &
  DataTableSortProps &
  DataTableSelectionProps<T>;
