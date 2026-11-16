namespace AgileRetro.WebApi.Integration.Tests;

[CollectionDefinition("Integration Tests")]
public class IntegrationTestCollection
    : ICollectionFixture<CustomWebApplicationFactory>
{
}