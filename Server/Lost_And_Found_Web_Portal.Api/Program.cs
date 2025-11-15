using Lost_And_Found_Web_Portal.Api.Middleware;
using Lost_And_Found_Web_Portal.Api.StartupExtensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.ConfigureServices(builder);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("DevCors");
}
else
{
    //app.UseSwagger();
    //app.UseSwaggerUI();
    app.UseCors("ProdCors");
}
app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseMiddleware<TokenBlacklistMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
