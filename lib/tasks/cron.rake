namespace :cron do
  desc 'Sample cron task'
  task :sample do
    puts 'Hello, World'
  end

  desc 'Sample cron task 2'
  task :sample2 do
    puts 'Hello, World!!!!!'
  end
end
