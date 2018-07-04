FROM circleci/ruby:2.4.4-node

ENV RAILS_ENV=test
ENV TZ=/usr/share/zoneinfo/Asia/Tokyo
ENV LANG=ja_JP.UTF-8
ENV LC_ALL=C.UTF-8
ENV LANGUAGE=ja_JP.UTF-8

RUN sudo mkdir /app
WORKDIR /app

ADD Gemfile /app
ADD Gemfile.lock /app
RUN bundle install -j4

COPY . /app
RUN sudo chown -R `whoami` .

CMD bash -c "bundle exec rails db:create db:schema:load && bundle exec rspec"
