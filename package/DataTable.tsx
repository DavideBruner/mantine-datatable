import { Box, createStyles, MantineSize, MantineTheme, packSx, Table } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useEffect, type ChangeEventHandler, type CSSProperties, type Key, type MouseEventHandler } from 'react';
import DataTableEmptyRow from './DataTableEmptyRow';
import DataTableEmptyState from './DataTableEmptyState';
import DataTableFooter from './DataTableFooter';
import DataTableHeader from './DataTableHeader';
import DataTableLoader from './DataTableLoader';
import DataTableRow from './DataTableRow';
import DataTableRowMenu from './DataTableRowMenu';
import DataTableRowMenuDivider from './DataTableRowMenuDivider';
import DataTableRowMenuItem from './DataTableRowMenuItem';
import DataTableScrollArea from './DataTableScrollArea';
import { useLastSelectionChangeIndex, useRowContextMenu, useRowExpansion, useScrollStatus } from './hooks';
import { DataTableProps } from './types';
import { differenceBy, getValueAtPath, humanize, uniqBy } from './utils';

const EMPTY_OBJECT = {};

const useStyles = createStyles(
  (
    theme,
    {
      borderColor,
      rowBorderColor,
    }: {
      borderColor: string | ((theme: MantineTheme) => string);
      rowBorderColor: string | ((theme: MantineTheme) => string);
    }
  ) => {
    const borderColorValue = typeof borderColor === 'function' ? borderColor(theme) : borderColor;
    const rowBorderColorValue = typeof rowBorderColor === 'function' ? rowBorderColor(theme) : rowBorderColor;

    return {
      root: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        tr: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        },
        '&&': {
          'thead tr th': {
            borderBottomColor: borderColorValue,
          },
          'tbody tr td': {
            borderTopColor: rowBorderColorValue,
          },
        },
      },
      lastRowBorderBottomVisible: {
        'tbody tr:last-of-type td': {
          borderBottom: `1px solid ${rowBorderColorValue}`,
        },
      },
      textSelectionDisabled: {
        userSelect: 'none',
      },
      table: {
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
      tableWithBorder: {
        border: `1px solid ${borderColorValue}`,
      },
      tableWithColumnBorders: {
        '&&': {
          'th, td': {
            ':not(:first-of-type)': {
              borderLeft: `1px solid ${rowBorderColorValue}`,
            },
          },
        },
      },
      verticalAlignmentTop: {
        td: {
          verticalAlign: 'top',
        },
      },
      verticalAlignmentBottom: {
        td: {
          verticalAlign: 'bottom',
        },
      },
    };
  }
);

export default function DataTable<T>({
  withBorder,
  borderRadius,
  borderColor = (theme) => (theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]),
  rowBorderColor = (theme) =>
    theme.fn.rgba(theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3], 0.65),
  withColumnBorders,
  textSelectionDisabled,
  height = '100%',
  minHeight,
  shadow,
  verticalAlignment = 'center',
  fetching,
  columns,
  defaultColumnRender,
  idAccessor = 'id',
  records,
  selectedRecords,
  onSelectedRecordsChange,
  isRecordSelectable,
  sortStatus,
  onSortStatusChange,
  horizontalSpacing,
  page,
  onPageChange,
  totalRecords,
  recordsPerPage,
  onRecordsPerPageChange,
  recordsPerPageOptions,
  recordsPerPageLabel = 'Records per page',
  paginationColor,
  paginationSize = 'sm',
  paginationText = ({ from, to, totalRecords }) => `${from} - ${to} / ${totalRecords}`,
  paginationWrapBreakpoint = 'sm',
  loaderBackgroundBlur,
  customLoader,
  loaderSize,
  loaderVariant,
  loaderColor,
  loadingText = '...',
  emptyState,
  noRecordsText = 'No records',
  noRecordsIcon,
  striped,
  onRowClick,
  onCellClick,
  rowContextMenu,
  rowExpansion,
  rowClassName,
  rowStyle,
  rowSx,
  customRowAttributes,
  bodyRef,
  m,
  my,
  mx,
  mt,
  mb,
  ml,
  mr,
  sx,
  className,
  classNames,
  style,
  styles,
  ...otherProps
}: DataTableProps<T>) {
  const {
    ref: scrollViewportRef,
    width: scrollViewportWidth,
    height: scrollViewportHeight,
  } = useElementSize<HTMLDivElement>();
  const { ref: headerRef, height: headerHeight } = useElementSize<HTMLTableSectionElement>();
  const { ref: tableRef, width: tableWidth, height: tableHeight } = useElementSize<HTMLTableElement>();
  const { ref: footerRef, height: footerHeight } = useElementSize<HTMLDivElement>();

  const {
    scrolledToTop,
    setScrolledToTop,
    scrolledToBottom,
    setScrolledToBottom,
    scrolledToLeft,
    setScrolledToLeft,
    scrolledToRight,
    setScrolledToRight,
  } = useScrollStatus();

  const { rowContextMenuInfo, setRowContextMenuInfo } = useRowContextMenu<T>(fetching);
  const rowExpansionInfo = useRowExpansion<T>({ rowExpansion, records, idAccessor });

  const onScrollPositionChange = () => {
    if (!fetching && rowContextMenu) {
      setRowContextMenuInfo(null);
    }

    if (fetching || tableHeight <= scrollViewportHeight) {
      setScrolledToTop(true);
      setScrolledToBottom(true);
    } else {
      const scrollTop = scrollViewportRef.current.scrollTop;
      setScrolledToTop(scrollTop === 0);
      setScrolledToBottom(Math.round(tableHeight - scrollTop) === Math.round(scrollViewportHeight));
    }

    if (fetching || tableWidth === scrollViewportWidth) {
      setScrolledToLeft(true);
      setScrolledToRight(true);
    } else {
      const scrollLeft = scrollViewportRef.current.scrollLeft;
      setScrolledToLeft(scrollLeft === 0);
      setScrolledToRight(Math.round(tableWidth - scrollLeft) === Math.round(scrollViewportWidth));
    }
  };

  /**
   * React hooks linting rule would recommend to also include the `useDobouncedState` setters
   * (setScrolledToBottom, setScrolledToLeft, setScrolledToRight, setScrolledToTop) in the effect
   * dependecies, but it looks like there's actually no need to.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(onScrollPositionChange, [
    fetching,
    scrollViewportHeight,
    scrollViewportRef,
    scrollViewportWidth,
    tableHeight,
    tableWidth,
  ]);

  const handlePageChange = (page: number) => {
    scrollViewportRef.current.scrollTo({ top: 0, left: 0 });
    onPageChange!(page);
  };

  const recordsLength = records?.length;
  const recordIds = records?.map((record) => getValueAtPath(record, idAccessor));
  const selectedRecordIds = selectedRecords?.map((record) => getValueAtPath(record, idAccessor));
  const hasRecordsAndSelectedRecords =
    recordIds !== undefined && selectedRecordIds !== undefined && selectedRecordIds.length > 0;

  const selectableRecords = isRecordSelectable ? records?.filter(isRecordSelectable) : records;
  const selectableRecordIds = selectableRecords?.map((record) => getValueAtPath(record, idAccessor));

  const allSelectableRecordsSelected =
    hasRecordsAndSelectedRecords && selectableRecordIds!.every((id) => selectedRecordIds.includes(id));
  const someRecordsSelected =
    hasRecordsAndSelectedRecords && selectableRecordIds!.some((id) => selectedRecordIds.includes(id));

  let handleHeaderSelectionChange: (() => void) | undefined;
  if (onSelectedRecordsChange) {
    handleHeaderSelectionChange = () => {
      onSelectedRecordsChange(
        allSelectableRecordsSelected
          ? selectedRecords.filter((record) => !selectableRecordIds!.includes(getValueAtPath(record, idAccessor)))
          : uniqBy([...selectedRecords, ...selectableRecords!], (record) => getValueAtPath(record, idAccessor))
      );
    };
  }

  const { lastSelectionChangeIndex, setLastSelectionChangeIndex } = useLastSelectionChangeIndex(recordIds);
  const selectionVisibleAndNotScrolledToLeft = !!selectedRecords && !scrolledToLeft;
  const { cx, classes, theme } = useStyles({ borderColor, rowBorderColor });
  const marginProperties = { m, my, mx, mt, mb, ml, mr };
  const styleProperties = typeof styles === 'function' ? styles(theme, EMPTY_OBJECT, EMPTY_OBJECT) : styles;

  return (
    <Box
      {...marginProperties}
      className={cx(classes.root, { [classes.tableWithBorder]: withBorder }, className, classNames?.root)}
      sx={[
        (theme) => ({
          borderRadius: theme.radius[borderRadius as MantineSize] || borderRadius,
          boxShadow: theme.shadows[shadow as MantineSize] || shadow,
          height,
          minHeight,
        }),
        ...packSx(sx),
      ]}
      style={{ ...styleProperties?.root, ...style } as CSSProperties}
    >
      <DataTableScrollArea
        ref={scrollViewportRef}
        topShadowVisible={!scrolledToTop}
        leftShadowVisible={!(selectedRecords || scrolledToLeft)}
        rightShadowVisible={!scrolledToRight}
        bottomShadowVisible={!scrolledToBottom}
        headerHeight={headerHeight}
        onScrollPositionChange={onScrollPositionChange}
      >
        <Table
          ref={tableRef}
          horizontalSpacing={horizontalSpacing}
          className={cx(classes.table, {
            [classes.tableWithColumnBorders]: withColumnBorders,
            [classes.lastRowBorderBottomVisible]: tableHeight < scrollViewportHeight,
            [classes.textSelectionDisabled]: textSelectionDisabled,
            [classes.verticalAlignmentTop]: verticalAlignment === 'top',
            [classes.verticalAlignmentBottom]: verticalAlignment === 'bottom',
          })}
          striped={recordsLength ? striped : false}
          {...otherProps}
        >
          <DataTableHeader<T>
            ref={headerRef}
            className={classNames?.header}
            style={styleProperties?.header}
            columns={columns}
            sortStatus={sortStatus}
            onSortStatusChange={onSortStatusChange}
            selectionVisible={!!selectedRecords}
            selectionChecked={allSelectableRecordsSelected}
            selectionIndeterminate={someRecordsSelected && !allSelectableRecordsSelected}
            onSelectionChange={handleHeaderSelectionChange}
            leftShadowVisible={selectionVisibleAndNotScrolledToLeft}
          />
          <tbody ref={bodyRef}>
            {recordsLength ? (
              records.map((record, recordIndex) => {
                const recordId = getValueAtPath(record, idAccessor);
                const isSelected = selectedRecordIds?.includes(recordId) || false;

                let showContextMenuOnClick = false;
                let showContextMenuOnRightClick = false;
                if (rowContextMenu) {
                  const { hidden } = rowContextMenu;
                  if (!hidden || !(typeof hidden === 'function' ? hidden(record, recordIndex) : hidden)) {
                    if (rowContextMenu.trigger === 'click') {
                      showContextMenuOnClick = true;
                    } else {
                      showContextMenuOnRightClick = true;
                    }
                  }
                }

                let handleSelectionChange: ChangeEventHandler<HTMLInputElement> | undefined;
                if (onSelectedRecordsChange) {
                  handleSelectionChange = (e) => {
                    if ((e.nativeEvent as PointerEvent).shiftKey && lastSelectionChangeIndex !== null) {
                      const targetRecords = records.filter(
                        recordIndex > lastSelectionChangeIndex
                          ? (r, index) =>
                              index >= lastSelectionChangeIndex &&
                              index <= recordIndex &&
                              (isRecordSelectable ? isRecordSelectable(r, index) : true)
                          : (r, index) =>
                              index >= recordIndex &&
                              index <= lastSelectionChangeIndex &&
                              (isRecordSelectable ? isRecordSelectable(r, index) : true)
                      );
                      onSelectedRecordsChange(
                        isSelected
                          ? differenceBy(selectedRecords, targetRecords, (r) => getValueAtPath(r, idAccessor))
                          : uniqBy([...selectedRecords, ...targetRecords], (r) => getValueAtPath(r, idAccessor))
                      );
                    } else {
                      onSelectedRecordsChange(
                        isSelected
                          ? selectedRecords.filter((record) => getValueAtPath(record, idAccessor) !== recordId)
                          : uniqBy([...selectedRecords, record], (record) => getValueAtPath(record, idAccessor))
                      );
                    }
                    setLastSelectionChangeIndex(recordIndex);
                  };
                }

                let handleClick: MouseEventHandler<HTMLTableRowElement> | undefined;
                if (showContextMenuOnClick) {
                  handleClick = (e) => {
                    setRowContextMenuInfo({ y: e.clientY, x: e.clientX, record, recordIndex });
                    onRowClick?.(record, recordIndex);
                  };
                } else if (onRowClick) {
                  handleClick = () => {
                    onRowClick(record, recordIndex);
                  };
                }

                let handleContextMenu: MouseEventHandler<HTMLTableRowElement> | undefined;
                if (showContextMenuOnRightClick) {
                  handleContextMenu = (e) => {
                    e.preventDefault();
                    setRowContextMenuInfo({ y: e.clientY, x: e.clientX, record, recordIndex });
                  };
                }

                return (
                  <DataTableRow<T>
                    key={recordId as Key}
                    record={record}
                    recordIndex={recordIndex}
                    columns={columns}
                    defaultColumnRender={defaultColumnRender}
                    selectionVisible={!!selectedRecords}
                    selectionChecked={isSelected}
                    onSelectionChange={handleSelectionChange}
                    isRecordSelectable={isRecordSelectable}
                    onClick={handleClick}
                    onCellClick={onCellClick}
                    onContextMenu={handleContextMenu}
                    contextMenuVisible={
                      rowContextMenuInfo ? getValueAtPath(rowContextMenuInfo.record, idAccessor) === recordId : false
                    }
                    expansion={rowExpansionInfo}
                    className={rowClassName}
                    style={rowStyle}
                    sx={rowSx}
                    customRowAttributes={customRowAttributes}
                    leftShadowVisible={selectionVisibleAndNotScrolledToLeft}
                  />
                );
              })
            ) : (
              <DataTableEmptyRow />
            )}
          </tbody>
        </Table>
      </DataTableScrollArea>
      {page && (
        <DataTableFooter
          ref={footerRef}
          className={classNames?.pagination}
          style={styleProperties?.pagination}
          topBorderColor={borderColor}
          horizontalSpacing={horizontalSpacing}
          fetching={fetching}
          page={page}
          onPageChange={handlePageChange}
          totalRecords={totalRecords}
          recordsPerPage={recordsPerPage}
          onRecordsPerPageChange={onRecordsPerPageChange}
          recordsPerPageOptions={recordsPerPageOptions}
          recordsPerPageLabel={recordsPerPageLabel}
          paginationColor={paginationColor}
          paginationSize={paginationSize}
          paginationText={paginationText}
          paginationWrapBreakpoint={paginationWrapBreakpoint}
          noRecordsText={noRecordsText}
          loadingText={loadingText}
          recordsLength={recordsLength}
        />
      )}
      <DataTableLoader
        pt={headerHeight}
        pb={footerHeight}
        fetching={fetching}
        backgroundBlur={loaderBackgroundBlur}
        customContent={customLoader}
        size={loaderSize}
        variant={loaderVariant}
        color={loaderColor}
      />
      <DataTableEmptyState
        pt={headerHeight}
        pb={footerHeight}
        icon={noRecordsIcon}
        text={noRecordsText}
        active={!fetching && !recordsLength}
      >
        {emptyState}
      </DataTableEmptyState>
      {rowContextMenu && rowContextMenuInfo && (
        <DataTableRowMenu
          zIndex={rowContextMenu.zIndex}
          borderRadius={rowContextMenu.borderRadius}
          shadow={rowContextMenu.shadow}
          y={rowContextMenuInfo.y}
          x={rowContextMenuInfo.x}
          onDestroy={() => setRowContextMenuInfo(null)}
        >
          {rowContextMenu
            .items(rowContextMenuInfo.record, rowContextMenuInfo.recordIndex)
            .map(({ divider, key, title, icon, color, hidden, disabled, onClick }) =>
              divider ? (
                <DataTableRowMenuDivider key={key} />
              ) : hidden ? null : (
                <DataTableRowMenuItem
                  key={key}
                  title={title ?? humanize(key)}
                  icon={icon}
                  color={color}
                  disabled={disabled}
                  onClick={() => {
                    setRowContextMenuInfo(null);
                    onClick();
                  }}
                />
              )
            )}
        </DataTableRowMenu>
      )}
    </Box>
  );
}
