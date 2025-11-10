using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Lost_And_Found_Web_Portal.Core.Services
{
    public class AutoMatchingService : BackgroundService
    {
        private readonly ILogger<AutoMatchingService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public AutoMatchingService(ILogger<AutoMatchingService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Auto-matching service running at: {time}", DateTimeOffset.Now);

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var lostAndFoundService = scope.ServiceProvider.GetRequiredService<ILostAndFoundService>();

                        await PerformAutoMatching(lostAndFoundService);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred in Auto-matching service");
                }

                await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken);
            }
        }

        private async Task PerformAutoMatching(ILostAndFoundService lostAndFoundService)
        {
            try
            {
                List<LostItemToShowDTO> lostItems = await lostAndFoundService.GetAllLostItemsWithoutImages();

                List<FoundItemToShowDTO> foundItems = await lostAndFoundService.GetAllFoundItem();


                foreach (LostItemToShowDTO lostItem in lostItems)
                {
                    List<FoundItemToShowDTO> potentialMatches = foundItems.Where(foundItem =>
                    {
                        bool sameType = string.Equals(lostItem.Type, foundItem.Type, StringComparison.OrdinalIgnoreCase);

                        bool similarDate = lostItem.Date.HasValue && foundItem.FoundDate.HasValue &&
                                         Math.Abs((lostItem.Date.Value - foundItem.FoundDate.Value).TotalDays) <= 3;

                        bool nearbyLocation = false;
                        if (lostItem.Latitude.HasValue && lostItem.Longitude.HasValue &&
                            foundItem.Latitude.HasValue && foundItem.Longitude.HasValue)
                        {
                            using var calcScope = _serviceProvider.CreateScope();
                            var calculationHelper = new Lost_And_Found_Web_Portal.Core.Helpers.CalculationHelper();

                            double distance = calculationHelper.CalculateDistance(
                                (double)lostItem.Latitude.Value,
                                (double)lostItem.Longitude.Value,
                                (double)foundItem.Latitude.Value,
                                (double)foundItem.Longitude.Value
                            );

                            nearbyLocation = distance <= .50; 
                        }

                        return (sameType && nearbyLocation) || (similarDate && nearbyLocation);
                    }).ToList();

                    if (potentialMatches.Any())
                    {
                        _logger.LogInformation($"Found {potentialMatches.Count} potential matches for lost item {lostItem.Id}");

                        foreach (var match in potentialMatches)
                        {
                            _logger.LogInformation($"Potential match: Lost item {lostItem.Id} with Found item {match.Id}");

                            NotificationToAddDTO notification = new NotificationToAddDTO
                            {
                                NotificationReceiver = lostItem.OwnerId.HasValue ? lostItem.OwnerId.Value : throw new InvalidOperationException("OwnerId is null"),
                                FoundItemId = match.Id,
                                IsRead = false,
                                Details = $"A potential match found for your lost item '{lostItem.Type}'. Found at Latitude: {match.Latitude}, Longitude: {match.Longitude}"
                            };
                            await lostAndFoundService.AddNotification(notification);

                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in PerformAutoMatching");
            }
        }
    }
}