package com.formweaverai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.convert.DefaultDbRefResolver;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

@Configuration
public class MongoConfig {
  @Bean
  public MappingMongoConverter mappingMongoConverter(
    MongoDatabaseFactory factory,
    MongoCustomConversions conversions,
    MongoMappingContext context
  ) {
    var resolver = new DefaultDbRefResolver(factory);
    var converter = new MappingMongoConverter(resolver, context);
    converter.setCustomConversions(conversions);
    // Disable _class mapping to avoid JsonNode/ObjectNode instantiation issues.
    converter.setTypeMapper(new DefaultMongoTypeMapper(null));
    return converter;
  }
}
