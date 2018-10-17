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
ARG RAILS_ENV

COPY setenv.sh /root/setenv.sh
RUN chmod 755 /root/setenv.sh && echo 'source /root/setenv.sh' >>/root/.bashrc

COPY . /app
RUN RAILS_ENV=$RAILS_ENV SECRET_KEY_BASE=$SECRET_KEY_BASE bundle exec rails assets:precompile
RUN mkdir -p /var/spool/cron/crontabs && bundle exec whenever -i rails -x 'busybox crontab'

COPY entrypoint.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["bundle", "exec", "foreman", "start"]
