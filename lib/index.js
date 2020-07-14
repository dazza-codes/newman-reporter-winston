/* jshint esversion: 6 */
/* jshint node: true */

// See also
// https://github.com/postmanlabs/newman/blob/develop/lib/reporters/cli/index.js
// https://github.com/postmanlabs/newman#community-maintained-reporters

const winston = require("winston");

const defaultWinstonOptions = {
  level: "info",
  transports: [new winston.transports.Console()],
};

class CustomNewmanReporter {
  constructor(emitter, reporterOptions, collectionRunOptions) {
    const newmanCollection = collectionRunOptions.collection;

    // respect silent option to not report anything
    if (reporterOptions.silent || collectionRunOptions.silent) {
      return; // we simply do not register anything!
    }

    // overwrite default options for winston with reporterOptions
    const winstonOptions = Object.assign(
      defaultWinstonOptions,
      reporterOptions
    );
    this.logger = winston.createLogger(winstonOptions);

    emitter.on("start", () => {
      var collectionId =
        newmanCollection && (newmanCollection.name || newmanCollection.id);
      this.logger.info(`run started for collection: ${collectionId}`);
      this.count = 1;
    });

    emitter.on("beforeItem", (err, o) => {
      if (err) {
        return;
      }
      // var itemGroup = o.item.parent();
      this.logger.info(`run ${o.item.name}`);
    });

    emitter.on("beforeRequest", (err, o) => {
      if (err || !o.request) {
        return;
      }
      this.logger.info(`${o.request.method} ${o.request.url.toString()}`);
    });

    emitter.on("request", (err, o) => {
      if (err) {
        logger.error(err.message);
        return;
      }

      if (o.response) {
        var size = o.response.size();
        size = (size && (size.header || 0) + (size.body || 0)) || 0;
        const responseData = {
          code: o.response.code,
          reason: o.response.reason(),
          size: size,
          time: o.response.responseTime,
        };
        this.logger.info(responseData);
      }
    });

    emitter.on("script", (err, o) => {});

    if (!reporterOptions.noAssertions) {
      emitter.on("assertion", function (err, o) {
        if (err) {
          this.logger.error(
            `[ASSERTION FAILED] [${this.count} / ${o.item.name}]: "${o.assertion}"`,
            err.message
          );
        } else {
          if (!reporterOptions.noSuccessAssertions) {
            if (o.skipped) {
              this.logger.info("[ASSERTION SKIPPED] " + o.assertion);
            } else {
              this.logger.info(
                `[ASSERTION PASSED] [${this.count} / ${o.item.name}]: "${o.assertion}"`
              );
            }
          }
        }
        this.count++;
      });
    }

    emitter.on("done", () => {
      var collectionId =
        newmanCollection && (newmanCollection.name || newmanCollection.id);
      this.logger.info(
        `run completed for collection: ${collectionId}, ${this.count} tests executed`
      );

      // var run = this.summary && this.summary.run;

      // // show the summary table (when option does not prevent it)
      // if (!reporterOptions.noSummary && run) {
      //   self.logger.info("statistics: ", run.stats);
      //   self.logger.info("timings: ", run.timings);
      //   self.logger.info("transfers: ", run.transfers);
      // }

      // // show the failures table (when option does not prevent it)
      // if (!reporterOptions.noFailures && run && run.failures && run.failures.length) {
      //   self.logger.error(run.failures);
      // }
    });
  }
}

module.exports = CustomNewmanReporter;
