function request(url, method, data) {
	return new Promise((resolve) => fetch(url, {
		method: method,
		headers: {
			'Content-Type': 'application/json',
			'X-Requested-With': 'XMLHttpRequest'
		},
		body: data ? JSON.stringify(data) : null
	})
	.then(response => response.json())
	.then(data => resolve([data, null]))
	.catch(error => resolve([null, error])));
}

document.addEventListener('DOMContentLoaded', async () => {
	const pages = {
		'/': 'main',
		'/game1/': 'game1',
		'/game2/': 'game2',
		'/login/': 'login',
		'/register/': 'register',
	};

	const [{structure, components}, error] = await request('get_components', 'GET', null);


	if (error) {
        console.error('Error fetching components:', error);
        loadContent(structure && structure['500'] ? structure['500'] : ['navigation', '500']);
        return;
    }

    if (!structure || !components) {
        console.error('Invalid response structure:', {structure, components});
        loadContent(['navigation', '500']);
        return;
    }

	const pageName = pages[location.pathname] || '404';

	if(pageName == null)
		loadContent(structure['404']);
	else
		loadContent(structure[pageName]);

	function navigate(event) {
		event.preventDefault();
		const url = event.target.href;
		const pageName = event.target.getAttribute('data-page');

		// TODO: fire load and unload events

		if (!structure[pageName]) {
			history.pushState(null, '', '/404/');
			loadContent(structure['404']);
		} else {
			history.pushState(null, '', url);
			loadContent(structure[pageName]);
		}
	}

	function loadContent(requiredComponents) {
		for (const componentName of requiredComponents) {
			const { parent, html } = components[componentName];

			const content = document.querySelector(`[data-container="${parent}"]`);
			content.innerHTML = html;
		}
	}

	document.addEventListener('click', (event) => {
		if (event.target.matches('a[data-page]')) {
			event.preventDefault();
			navigate(event);
		}
	});

	window.onpopstate = (event) => {
		event.preventDefault();

		const pageName = pages[location.pathname] || '404';
			loadContent(structure[pageName]);
	};
});