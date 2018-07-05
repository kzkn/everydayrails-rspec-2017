FROM circleci/ruby:2.4.4-node

ENV RAILS_ENV=test
ENV TZ=/usr/share/zoneinfo/Asia/Tokyo
ENV LANG=ja_JP.UTF-8
ENV LC_ALL=C.UTF-8
ENV LANGUAGE=ja_JP.UTF-8

WORKDIR /tmp
ADD Gemfile /tmp
ADD Gemfile.lock /tmp
RUN bundle install -j4

RUN sudo mkdir /app
COPY . /app

WORKDIR /app
RUN sudo chown -R `whoami` .
CMD ./ci/run.sh
