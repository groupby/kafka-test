const elasticsearch = require('@groupby/common').clients.elasticsearch;
const common        = require('@groupby/common');
const Kafka         = common.clients.kafka;
const events        = common.models.events;
const KafkaReader   = require('@groupby/common/services/kafkaReader');
const Promise       = require('bluebird');
const log           = require('./logger');
const utils         = common.utils;
const fs            = require('fs');
const uuid          = require('uuid');

const KAFKA_RETRY_INTERVAL_MS = 500;
const KAFKA_RETRY_TIMEOUT_MS  = 10 * 60 * 1000;

const zookeeperConfig = {
  port: 2181,
  host: 'localhost'
};

const kafkaConfig = {
  topic:   'testTopic',
  groupId: uuid.v4()
};

const createKafkaConsumer = () => Kafka.createConsumer(zookeeperConfig.host, zookeeperConfig.port, kafkaConfig.topic, kafkaConfig.groupId);

const kafkaReader = new KafkaReader(createKafkaConsumer, (msg) => {
  console.log('Received');
  console.log(msg);

  return Promise.resolve();
});

const tryOpenReader = () => kafkaReader.open()
  .return(true)
  .catchReturn(false);

common.utils.promiseUntil((res) => res, tryOpenReader, KAFKA_RETRY_INTERVAL_MS)
  .timeout(KAFKA_RETRY_TIMEOUT_MS)
  .catch(() => process.nextTick(() => {
    throw new Error('Could not open kafkaWriter');
  }))
  .then(() => {
    log.info('Reader ready');
  });