

* Start the docker container
```
docker run -it --name vuejs -p 8081:8081 -v ${PWD}:/app -w /app --network lora-orion-ld_default vuejs
``` 

```
npm run serve -p 8081
```