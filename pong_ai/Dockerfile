FROM tensorflow/tensorflow:2.10.0

WORKDIR /workspace/pong_ai

COPY . /workspace/pong_ai/

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

# CMD ["bash"]

CMD ["python", "pong_api.py"]