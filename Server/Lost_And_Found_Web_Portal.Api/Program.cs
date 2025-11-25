using Lost_And_Found_Web_Portal.Api.Hubs;
using Lost_And_Found_Web_Portal.Api.Middleware;
using Lost_And_Found_Web_Portal.Api.StartupExtensions;
using Lost_And_Found_Web_Portal.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.ConfigureServices(builder);

var app = builder.Build();

using var serrviceScope= app.Services.CreateScope();
using var dbContext= serrviceScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

dbContext?.Database.Migrate();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("DevCors");
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("ProdCors");
}

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseMiddleware<TokenBlacklistMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.MapHub<ChatHub>("/chathub");

app.Run();
