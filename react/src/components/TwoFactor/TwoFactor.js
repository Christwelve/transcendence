import React, { useState, useEffect, useRef } from 'react'
import styles from './TwoFactor.module.scss'
import { protocol, hostname, djangoPort } from '../../utils/scheme'



const TwoFactor = ({ changeStatus, userLogin, errorMessage, user }) => {
  const [otp, setOtp] = useState("");
  const [qrCode, setQrCode] = useState("");
  const hasFetched = useRef(false);


  useEffect(() => {
    if (hasFetched.current) return; // Prevent duplicate execution
    hasFetched.current = true;
    // console.log("TwoFactor");

    generateQRCode();


  }, []);

  const generateQRCode = async () => {
    // console.log("User:", user.username);
    const formData = new FormData();
    formData.append("username", user.username);
    // const response = await fetch(`${protocol}//${hostname}:${djangoPort}/api/2fa/generate/`, {
    const response = await fetch(`${protocol}//${hostname}/api/2fa/generate/`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      // console.log("Data", data);
      const imageUrl = data.qr_code;

      setQrCode(imageUrl);
    }
  };

  const _onOtpChange = (event) => {
    setOtp(event.target.value);
  };

  const createForm = () => {
    const formData = new FormData();
    formData.append("otp_token", otp);
    formData.append("username", user.username);
    formData.append("password", user.password);

    return formData;
  };

  const _onFormSubmit = (event) => {
    event.preventDefault();
    const form = createForm();
    userLogin(form, true);
  };

  return (
    <div className={styles.container}>
      <h1>TwoFactor Authentication</h1>
      <form className={styles.form}>
        <div className={styles["form-group"]}>
          <label htmlFor="otp" className={styles["form-label"]}>
            OTP code
          </label>
          <input
            type="otp"
            className={styles["form-control"]}
            id="otp"
            placeholder="123456"
            onChange={_onOtpChange}
          />
        </div>
        <div className={styles["form-group"]}>
          <p>
            Scan here with an authenticator app{" "}
            <img
              src={qrCode}
              alt="QR code"
              width={250}
              height={250} />
          </p>
        </div>
        <div className="mb-3">
          <button
            type="submit"
            className={styles["btn-primary"]}
            onClick={_onFormSubmit}
          >
            Authenticate
          </button>
        </div>
      </form>
      <p className="error">{errorMessage}</p>
    </div>
  );
};

export default TwoFactor;
