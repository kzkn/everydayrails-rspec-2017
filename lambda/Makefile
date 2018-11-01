deploy-ecs-scheduler.zip: index.js
	zip -r $@ index.js node_modules

.PHONY: clean
clean:
	-rm deploy-ecs-scheduler.zip
