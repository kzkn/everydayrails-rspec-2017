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

# TODO: define outside of the dockerfile
ENV SECRET_KEY_BASE=e97eba46e1da7312a6bd9319c7460ec24ba3237d62164acd294c9ad702a5551c91c72ded72f01fd51f7fae50a1c58ceb476f6123bd27105b254f0e9216ea569d \
    DATABASE_HOST=testdb.cyoxs0qfhdq8.ap-northeast-1.rds.amazonaws.com \
    DATABASE_NAME=everydayrails \
    DATABASE_USERNAME=testdb \
    RAILS_ENV=production \
    RACK_ENV=production \
    RAILS_LOG_TO_STDOUT=1 \
    RAILS_SERVE_STATIC_FILES=1

RUN env | grep -v '^_=' | sed 's/^/export /' >>/root/.bashrc

COPY . /app
RUN RAILS_ENV=production bundle exec rails assets:precompile
RUN mkdir -p /var/spool/cron/crontabs && bundle exec whenever -i rails -x 'busybox crontab'

CMD ["sh", "-c", "RAILS_ENV=production bundle exec rails db:migrate && bundle exec foreman start"]
