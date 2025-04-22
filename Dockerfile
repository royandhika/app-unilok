FROM rabbitmq:4.1-management
RUN apt-get update && apt-get install -y curl
RUN curl -L https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v4.1.0/rabbitmq_delayed_message_exchange-4.1.0.ez \
        -o $RABBITMQ_HOME/plugins/rabbitmq_delayed_message_exchange.ez
RUN rabbitmq-plugins enable rabbitmq_delayed_message_exchange
