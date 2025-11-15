using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.Domain.IdentityEntities;
using Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.Helpers;
using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Services
{
    public class LostAndFoundService : ILostAndFoundService
    {
        private readonly ILogger<LostAndFoundService> _logger;
        private readonly ILostAndFoundRepository _lostAndFoundRepository;
        private readonly StringMatchHelper _stringMatchHelper;
        private readonly ImageConverter _imageConverter;
        private readonly CalculationHelper _calculationHelper;

        public LostAndFoundService(ILogger<LostAndFoundService> logger, ILostAndFoundRepository lostAndFoundRepository)
        {
            _logger = logger;
            _lostAndFoundRepository = lostAndFoundRepository;
            _stringMatchHelper = new StringMatchHelper();
            _imageConverter = new ImageConverter();
            _calculationHelper = new CalculationHelper();
        }

       

        public async Task<LostItemToShowDTO> AddLostItemAsync(LostItemToAddDTO lostItemToAddDTO, string ownerName, Guid ownerId, string webRootPath)
        {
            LostItemToShowDTO lostItemToShowDTO = new LostItemToShowDTO();

            LostItem lostItem = lostItemToAddDTO.ToLostItemEntity();

            lostItem.OwnerName = ownerName;
            lostItem.OwnerId = ownerId;
            if(lostItemToAddDTO.PhotoBase64 != null) lostItem.PhotoUrl = await _imageConverter.SaveBase64ImageAsync(lostItemToAddDTO.PhotoBase64, lostItem.Id, webRootPath);


            await _lostAndFoundRepository.AddLostItem(lostItem);

            lostItemToShowDTO = lostItem.ToLostItemToShow();
            lostItemToShowDTO.PhotoBase64 = lostItemToAddDTO.PhotoBase64;
            return lostItemToShowDTO;
        }

        public async Task<List<LostItemToShowDTO>> GetAllLostItemx(string webRootPath)
        {
            List<LostItem> lostItems =  _lostAndFoundRepository.GetAllLostItems();
            List<LostItemToShowDTO> lostItemToShowDTOs = lostItems.Select(li => li.ToLostItemToShow()).ToList();

            foreach(LostItemToShowDTO dto in lostItemToShowDTOs)
            {
                if(dto.PhotoBase64 != null) dto.PhotoBase64 =await _imageConverter.ConvertImageToBase64Async(dto.PhotoBase64, webRootPath);
            }

            lostItemToShowDTOs = lostItemToShowDTOs.OrderByDescending(li => li.CreatedAt).ToList();

            return lostItemToShowDTOs;
        }

        public async Task<List<LostItemToShowDTO>> GetLostItemById(string webRootPath, Guid Id)
        {
            List<LostItem> lostItems = _lostAndFoundRepository.GetLostItemsById(Id);
            List<LostItemToShowDTO> lostItemToShowDTOs = lostItems.Select(li => li.ToLostItemToShow()).ToList();

            foreach (LostItemToShowDTO dto in lostItemToShowDTOs)
            {
                if(dto.PhotoBase64 != null) dto.PhotoBase64 = await _imageConverter.ConvertImageToBase64Async(dto.PhotoBase64, webRootPath);
            }
            lostItemToShowDTOs = lostItemToShowDTOs.OrderBy(li => li.CreatedAt).ToList();
            return lostItemToShowDTOs;
        }

        public async Task<FoundItemToShowDTO> AddFoundItemAsync(FoundItemToAddDTO foundItemToAddDTO, string? ownerName, Guid ownerId)
        {
            FoundItem foundItem = foundItemToAddDTO.ToFoundItem();
            foundItem.OwnerName = ownerName;
            foundItem.OwnerId = ownerId;
            await _lostAndFoundRepository.AddFoundItemAsync(foundItem);

            return foundItem.ToFoundItemToShowDTO();
        }

        public async Task<List<FoundItemToShowDTO>> GetAllFoundItem()
        {
            List<FoundItem> foundItems = await _lostAndFoundRepository.GetAllFoundItems();
            List<FoundItemToShowDTO> foundItemToShowDTOs = foundItems.Select(fi => fi.ToFoundItemToShowDTO()).ToList();
            return foundItemToShowDTOs;
        }

        public async Task<List<FoundItemToShowDTO>> GetFoundItemById(Guid id)
        {
            List<FoundItem> foundItems = await _lostAndFoundRepository.GetFoundItemsById(id);
            List<FoundItemToShowDTO> foundItemToShowDTOs = foundItems.Select(fi => fi.ToFoundItemToShowDTO()).ToList();
            return foundItemToShowDTOs;
        }

        public async Task<List<FoundItemToShowDTO>> GetFilteredFoundItem(FilterAttributesDTO filterAttributesDTO)
        {
            List<FoundItem> foundItems = await _lostAndFoundRepository.GetAllFoundItems();

            var filteredItems = foundItems.Where(item =>
            {

                double distance = _calculationHelper.CalculateDistance(
                    (double)filterAttributesDTO.Latitude!,
                    (double)filterAttributesDTO.Longitude!,
                    (double)item.Latitude!,
                    (double)item.Longitude!
                );

                bool withinDistance = distance <= 0.3; 


                bool withinDateRange = Math.Abs((item.FoundDate!.Value - filterAttributesDTO.DateOfLoss!.Value).TotalDays) <= 3;

                return withinDistance && withinDateRange;
            }).ToList();

            var sortedItems = filteredItems
                .OrderByDescending(item => string.Equals(item.Type, filterAttributesDTO.ItemType, StringComparison.OrdinalIgnoreCase))
                .ThenBy(item => item.Type)
                .ToList();

            List<FoundItemToShowDTO> foundItemToShowDTOs = sortedItems.Select(fi => fi.ToFoundItemToShowDTO()).ToList();
            return foundItemToShowDTOs;

        }

        public async Task<List<LostItemToShowDTO>> GetAllLostItemsWithoutImages()
        {
            List<LostItem> lostItems = _lostAndFoundRepository.GetAllLostItems();
            List<LostItemToShowDTO> lostItemToShowDTOs = lostItems.Select(li => li.ToLostItemToShow()).ToList();

            return lostItemToShowDTOs;
        }


        public async Task AddNotification(NotificationToAddDTO notificationToAddDTO)
        {
            List<Notification> notifications = await _lostAndFoundRepository.GetNotification(notificationToAddDTO);

            if(notifications.Count == 0)
            {
                await _lostAndFoundRepository.AddNotification(notificationToAddDTO.ToNotification());
            }
        }

        public async Task<List<NotificationToShowDTO>> GetNotificationsByUserId(Guid id)
        {
            List<Notification> notifications =  await _lostAndFoundRepository.GetNotificationsByUserId(id);
            List<NotificationToShowDTO> notificationToShowDTOs = notifications.Select(n => n.ToNotificationToShowDTO()).ToList();
            return notificationToShowDTOs;
        }

        public async Task InvertNotificationAsRead(Guid notificationId)
        {
            await _lostAndFoundRepository.InvertNotificationAsRead(notificationId);
        }
    }
}
