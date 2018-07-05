FROM circleci/ruby:2.4.4-node-browsers

ENV RAILS_ENV=test
ENV TZ=/usr/share/zoneinfo/Asia/Tokyo
ENV LANG=ja_JP.UTF-8
ENV LC_ALL=C.UTF-8
ENV LANGUAGE=ja_JP.UTF-8

WORKDIR /tmp

RUN sudo apt-get install libappindicator3-1 postgresql-client-9.6 \
   && curl -L -o google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
   && sudo dpkg -i google-chrome.deb \
   && sudo sed -i 's|HERE/chrome\"|HERE/chrome\" --no-sandbox|g' /opt/google/chrome/google-chrome \
   && rm google-chrome.deb

ADD Gemfile /tmp
ADD Gemfile.lock /tmp
RUN bundle install -j4

RUN sudo mkdir /app
COPY . /app

WORKDIR /app
RUN sudo chown -R `whoami` .
CMD ./ci/run.sh
