FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Toronto

# Set Timezone and Locale
RUN apt-get update && \
    apt-get install -y tzdata locales && \
    ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata && \
    locale-gen en_US.UTF-8 && \
    update-locale LANG=en_US.UTF-8

RUN apt-get -qq update  && apt-get -y install curl tmux unzip xdg-utils git nano zip \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

COPY . .
RUN apt-get install sudo -y

RUN  cd /Ecommerce/shop-online-backend && npm install
RUN  cd /Ecommerce/shop-online-frontend && npm install


