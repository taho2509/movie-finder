const uuid = require("uuid");
const stan = require("node-nats-streaming").connect(
  "test-cluster",
  "movie-finder",
  {
    url: process.env.NATS_URL
  }
);
const movieProvider = require("./src/request");

stan.on("connect", () => {
  console.log("Worker connected to nats streaming test-cluster");
  // Subscriber can specify how many existing messages to get.
  const opts = stan.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setDurableName("movie-finder");
  opts.setManualAckMode(true);
  opts.setAckWait(10 * 1000); //10s
  const subscription = stan.subscribe(process.env.INCOMING_CHANNEL, opts);

  subscription.on("message", async msg => {
    console.log(`Received a message [${msg.getSequence()}] ${msg.getData()}`);
    const movieEvent = JSON.parse(msg.getData());
    const { title, year } = movieEvent.data;

    try {
      const movie = await movieProvider.searchMovie(title, year);
      msg.ack();

      if(!movie) return

      const event = {
        id: uuid.v4(),
        source: "/movie-finder",
        specversion: "1.0",
        type: "com.movie-finder.movie.found",
        datacontenttype: "application/json",
        subject: "movie_found",
        time: new Date().toISOString(),
        data: movie
      };

      stan.publish(
        process.env.OUTGOING_CHANNEL,
        JSON.stringify(event),
        (err, guid) => {
          if (err) {
            console.log(`publish failed: ${err}`);
            throw err;
          } else {
            console.log(`Message send successfully with guid: ${guid}`);
          }
        }
      );
    } catch (err) {
      console.log(`Request couldn´t be publish by err: ${err}`);
    }
  });
});

stan.on("close", () => {
  process.exit();
});
