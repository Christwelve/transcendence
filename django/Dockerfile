FROM python:3.10-slim

WORKDIR /code

COPY . /code/

RUN sed -i 's/\r$//' ./entrypoint.sh
RUN sed -i 's/\r$//' ./wait-for-it.sh
RUN pip install -r requirements.txt

EXPOSE 8000

ENTRYPOINT [ "./entrypoint.sh" ]

