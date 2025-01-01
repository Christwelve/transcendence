import React, {useState, useRef} from 'react'
import Icon from '../Icon/Icon';
import cls from '../../utils/cls'
import scss from './ToastPresenter.module.scss'

let toasts = [];
let toastId = 0;
let showToast = null;

function ToastPresenter() {

	const [update, setUpdate] = useState(0);
	const updateRef = useRef(null);

	updateRef.current = update;

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

		toasts.splice(5);
		toasts.push(toast);

		setUpdate(updateRef.current + 1);

		setTimeout(() => {
			toasts = toasts.filter(t => t !== toast);
			setUpdate(updateRef.current + 1);
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