FROM node:8.11.4 as node
FROM ruby:2.4.4

ENV LANG C.UTF-8
ENV YARN_VERSION 1.6.0

# node, yarn
COPY --from=node /opt/yarn-v$YARN_VERSION /opt/yarn
COPY --from=node /usr/local/bin/node /usr/local/bin
RUN ln -s /opt/yarn/bin/yarn /usr/local/bin/yarn \
  && ln -s /opt/yarn/bin/yarn /usr/local/bin/yarnpkg

RUN apt-get update && apt-get install -y build-essential libpq-dev openssh-server busybox-static

# Build sshd
# https://docs.docker.com/engine/examples/running_ssh_service/
RUN mkdir /var/run/sshd
RUN echo 'root:screencast' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd
ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile

# Build app
RUN mkdir /app
WORKDIR /app

COPY Gemfile /app/Gemfile
COPY Gemfile.lock /app/Gemfile.lock
RUN gem install bundler && bundle install -j 4

ARG SECRET_KEY_BASE
ARG DATABASE_HOST
ARG DATABASE_NAME
ARG DATABASE_USERNAME
ARG DATABASE_PASSWORD
ARG RAILS_ENV=production
ARG RACK_ENV=production
ARG RAILS_LOG_TO_STDOUT=1
ARG RAILS_SERVE_STATIC_FILES=1

ENV SECRET_KEY_BASE=$SECRET_KEY_BASE \
    DATABASE_HOST=$DATABASE_HOST \
    DATABASE_NAME=$DATABASE_NAME \
    DATABASE_USERNAME=$DATABASE_USERNAME \
    DATABASE_PASSWORD=$DATABASE_PASSWORD \
    RAILS_ENV=$RAILS_ENV \
    RACK_ENV=$RACK_ENV \
    RAILS_LOG_TO_STDOUT=$RAILS_LOG_TO_STDOUT \
    RAILS_SERVE_STATIC_FILES=$RAILS_SERVE_STATIC_FILES

RUN env | grep -v '^_=' | sed 's/^/export /' >>/root/.bashrc

COPY . /app
RUN RAILS_ENV=production bundle exec rails assets:precompile
RUN mkdir -p /var/spool/cron/crontabs && bundle exec whenever -i rails -x 'busybox crontab'

CMD ["sh", "-c", "RAILS_ENV=production bundle exec rails db:migrate && bundle exec foreman start"]
