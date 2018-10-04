class ShowCurrentTimestamp < ActiveRecord::Migration[5.1]
  def up
    tups = ActiveRecord::Base.connection.execute('select current_timestamp')
    puts tups[0]['current_timestamp']
  end

  def down
  end
end
