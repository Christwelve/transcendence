import React, {useState, useRef} from 'react'
import Icon from '../Icon/Icon';
import cls from '../../utils/cls'
import scss from './ToastPresenter.module.scss'

let showToast = null;
let toastId = 0;

function ToastPresenter() {
	const [toasts, setToasts] = useState([]);

	const toastsRef = useRef(null);

	toastsRef.current = toasts;

	showToast = options => {
		const {type, title, message} = options;

		const toast = (
			<div className={cls(scss.toast, scss[type])} key={toastId++}>
				<div className={scss.icon}>
					<Icon type={type} size="18" />
				</div>
				<div className={scss.content}>
					<div className={scss.title}>{title}</div>
					<div className={scss.message}>{message}</div>
				</div>
			</div>
		);

		const latestToasts = toastsRef.current.slice(-4);

		setToasts([...latestToasts, toast]);

		setTimeout(() => {
			setToasts(toastsRef.current.filter(t => t !== toast));
		}, 3000);
	};

	return (
		<div className={scss.toasts}>
			{toasts}
		</div>
	);
}

export default ToastPresenter;
export {showToast};