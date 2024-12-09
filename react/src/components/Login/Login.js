import React, { useState, useRef } from "react";
import styles from "./Login.module.scss";

const Login = ({ changeStatus, userLogin, errorMessage }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const robotFaceRef = useRef(null);

  const _onUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const _onPasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const createUser = () => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    return formData;
  };

  const _onFormSubmit = (event) => {
    event.preventDefault();
    const user = createUser();
    userLogin(user);
  };

  const circleBgClasses = [
    styles["circle-bg"],
    username.trim() ? styles["robot-smile-trigger"] : ""
  ].join(" ");

  // Eye offset states
  const [eyeOffsetX, setEyeOffsetX] = useState(0);
  const [eyeOffsetY, setEyeOffsetY] = useState(0);

  const _onMouseMove = (e) => {
    // If password is not empty, don't move the eyes
    if (password.trim().length > 0) return;

    if (robotFaceRef.current) {
      const rect = robotFaceRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const deltaX = mouseX - centerX;
      const deltaY = mouseY - centerY;

      const maxOffset = 5;
      let offsetX = (deltaX / (rect.width / 2)) * maxOffset;
      let offsetY = (deltaY / (rect.height / 2)) * maxOffset;

      if (offsetX > maxOffset) offsetX = maxOffset;
      if (offsetX < -maxOffset) offsetX = -maxOffset;
      if (offsetY > maxOffset) offsetY = maxOffset;
      if (offsetY < -maxOffset) offsetY = -maxOffset;

      setEyeOffsetX(offsetX);
      setEyeOffsetY(offsetY);
    }
  };

  // Determine if the eyes should be closed
  const robotFaceClasses = [styles["robot-face"]];
  if (password.trim().length > 0) {
    robotFaceClasses.push(styles["eyes-closed"]);
  }

  return (
    <div className={styles.container} onMouseMove={_onMouseMove}>
      <div className={styles.robot}>
        <div className={circleBgClasses}>
          <div className={`${styles["robot-ear"]} ${styles.left}`}></div>
          <div className={styles["robot-head"]}>
            <div
              className={robotFaceClasses.join(" ")}
              ref={robotFaceRef}
              style={{
                "--eye-offset-x": `${eyeOffsetX}px`,
                "--eye-offset-y": `${eyeOffsetY}px`
              }}
            >
              <div className={`${styles.eyes} ${styles.left}`}></div>
              <div className={`${styles.eyes} ${styles.right}`}></div>
              <div className={styles.mouth}></div>
            </div>
          </div>
          <div className={`${styles["robot-ear"]} ${styles.right}`}></div>
        </div>
      </div>

      <h1>Login</h1>
      <form className={`${styles.form} ${styles["pd-3"]}`} onSubmit={_onFormSubmit}>
        <div className={styles["form-group"]}>
          <label htmlFor="username" className={styles["form-label"]}>Username</label>
          <input
            type="text"
            className={styles["form-control"]}
            id="username"
            placeholder="example"
            onChange={_onUsernameChange}
          />
        </div>
        <div className={styles["form-group"]}>
          <label htmlFor="password" className={styles["form-label"]}>Password</label>
          <input
            type="password"
            id="password"
            className={styles["form-control"]}
            onChange={_onPasswordChange}
          />
        </div>
        <div className={styles["form-group"]}>
          <button
            type="submit"
            className={styles["btn-primary"]}
          >
            Login
          </button>
        </div>
        <div className={styles["form-group"]}>
          <p>Don't you have an account?{" "}</p>
          <span
            className={styles.link}
            onClick={() => {
              changeStatus("register");
            }}
          >
            <p>Register now</p>
          </span>
        </div>
      </form>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
    </div>
  );
};

export default Login;
