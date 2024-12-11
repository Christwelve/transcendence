import React from 'react';
import scss from './List.module.scss';
import cls from '../../utils/cls';

function List(props) {
  const { columnNames, component: ItemComponent, items, onClick, onDoubleClick, isSelected = () => false } = props;

  return (
    <table className={cls(scss.list)}>
      <thead>
        <tr className={cls(scss.row, scss.header)}>
          {columnNames.map((columnName) => (
            <th key={columnName}>{columnName}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <ItemComponent
            key={i}
            {...item}
            baseClasses={cls(scss.row, scss.item, isSelected(item) ? scss.selected : null)}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </tbody>
    </table>
  );
}

export default List;
