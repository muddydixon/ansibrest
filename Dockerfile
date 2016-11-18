FROM node

MAINTAINER muddydixon@gmail.com

ARG http_proxy=${http_proxy}
ARG https_proxy=${https_proxy}

ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}

RUN apt-get update && apt-get install -y python-setuptools python-dev expect
RUN easy_install pip
RUN pip install ansible
RUN npm install ansibrest -g

COPY . /opt/ansibrest
WORKDIR /opt/ansibrest
RUN npm -g config set registry http://registry.npmjs.org/

WORKDIR /opt

EXPOSE 2400

ENTRYPOINT ansibrest
CMD ["--log-dir /var/log/ansibrest"]
