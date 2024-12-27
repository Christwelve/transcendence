import React from 'react'
import Page from '../../pages/Page'
import scss from './Main.module.scss'

const Main = () => {
  return (
    <div className={scss.mainContainer}>
      <Page />
    </div>
  );
};

export default Main;
