FROM postgres:12

# Add custom configuration or extensions
COPY ./my_custom_config.conf /etc/postgresql/
COPY ./my_extensions.sql /docker-entrypoint-initdb.d/

CMD ["postgres", "-c", "config_file=/etc/postgresql/my_custom_config.conf"]
