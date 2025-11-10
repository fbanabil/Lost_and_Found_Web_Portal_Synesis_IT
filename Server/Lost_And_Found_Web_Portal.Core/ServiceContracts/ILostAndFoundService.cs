using Lost_And_Found_Web_Portal.Core.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.ServiceContracts
{
    public interface ILostAndFoundService
    {
        public Task<FoundItemToShowDTO> AddFoundItemAsync(FoundItemToAddDTO foundItemToAddDTO, string? ownerName, Guid ownerId);
        public Task<LostItemToShowDTO> AddLostItemAsync(LostItemToAddDTO lostItemToAddDTO,string ownerName,Guid ownerId,string webRootPath);
        public Task AddNotification(NotificationToAddDTO notificationToAddDTO);
        public Task<List<FoundItemToShowDTO>> GetAllFoundItem();
        public Task<List<LostItemToShowDTO>> GetAllLostItemx(string webRootPath);
        public Task<List<LostItemToShowDTO>> GetAllLostItemsWithoutImages();
        public Task<List<FoundItemToShowDTO>> GetFilteredFoundItem(FilterAttributesDTO filterAttributesDTO);
        public Task<List<FoundItemToShowDTO>> GetFoundItemById(Guid id);
        public Task<List<LostItemToShowDTO>> GetLostItemById(string webRootPath, Guid Id);
        public Task<List<NotificationToShowDTO>> GetNotificationsByUserId(Guid id);
        public Task InvertNotificationAsRead(Guid notificationId);
    }
}
