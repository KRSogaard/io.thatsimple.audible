import * as http from "http";
import App from "./app";
import { APILogger } from "./logger/api.logger";
import { RabbitMQConnection, RabbitMQAudibleChannel } from "./config/rabbitmq.config";
import { AudibleManagementService } from "./service/audible_management.service";
require("dotenv").config();

const port = process.env.PORT || 3080;

App.set("port", port);
const server = http.createServer(App);
server.listen(port);

const logger = new APILogger();
const audibleManagementService = new AudibleManagementService();

server.on("listening", function (): void {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on `, bind);
});

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let lastProcessingTime = 0;

RabbitMQConnection().then((connection) => {
  connection.createChannel().then(async (channel) => {
    channel.assertQueue(RabbitMQAudibleChannel(), { durable: false });
    channel.prefetch(1);
    logger.info("Message listener started", RabbitMQAudibleChannel());
    while (true) {
      try {
        let message = await channel.get(RabbitMQAudibleChannel());
        if (!message) {
          await delay(1000);
          continue;
        }
        lastProcessingTime = new Date().getTime();
        let data = message.content.toString();
        let obj;
        try {
          obj = JSON.parse(data);
        } catch (error) {
          logger.error("Failed to parse message", null);
          channel.ack(message);
          continue;
        }

        if (obj.type === "book") {
          audibleManagementService.downloadBook(obj.url, true, obj.userId);
        } else if (obj.type == "series") {
          audibleManagementService.downloadSeries(obj.url, true);
        } else {
          logger.error("Unknown message type", null);
        }

        channel.ack(message);
        let timePassed = new Date().getTime() - lastProcessingTime;
        if (timePassed < 5000) {
          console.log("Waiting for 5 seconds", 5000 - timePassed);
          await delay(5000 - timePassed);
        }
      } catch (error) {
        logger.error("Failed to process message", error);
      }
    }

    // channel.consume(
    //   RabbitMQAudibleChannel(),
    //   (msg: any) => {
    //     lastProcessingTime = new Date().getTime();
    //     console.log("Received message: ", msg.content.toString());
    //     let timePassed = new Date().getTime() - lastProcessingTime;
    //     console.log("Time passed: ", timePassed);
    //   },
    //   {
    //     noAck: true,
    //   }
    // );
  });
});

module.exports = App;
