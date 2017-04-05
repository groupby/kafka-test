const elasticsearch = require('@groupby/common').clients.elasticsearch;
const common        = require('@groupby/common');
const Kafka         = common.clients.kafka;
const events        = common.models.events;
const KafkaWriter   = require('@groupby/common/services/kafkaWriter');
const Promise       = require('bluebird');
const log           = require('./logger');
const utils         = common.utils;
const fs = require('fs');

const KAFKA_RETRY_INTERVAL_MS = 500;
const KAFKA_RETRY_TIMEOUT_MS  = 10 * 60 * 1000;

const zookeeperConfig = {
  port: 2181,
  host: 'localhost'
};

const kafkaConfig = {
  topic:   'testTopic'
};

const kafkaWriter = new KafkaWriter(Kafka.createProducer(zookeeperConfig.host, zookeeperConfig.port, kafkaConfig.topic));

const tryOpenWriter = () => kafkaWriter.open()
  .return(true)
  .catchReturn(false);

common.utils.promiseUntil((res) => res, tryOpenWriter, KAFKA_RETRY_INTERVAL_MS)
  .timeout(KAFKA_RETRY_TIMEOUT_MS)
  .catch(() => process.nextTick(() => {
    throw new Error('Could not open kafkaWriter');
  }))
  .then(() => {
    log.info('writer ready');

    // kafkaWriter.write(someObject)
  });