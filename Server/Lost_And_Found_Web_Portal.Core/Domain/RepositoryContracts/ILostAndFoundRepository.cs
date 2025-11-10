using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts
{
    public interface ILostAndFoundRepository
    {
        public Task AddFoundItemAsync(FoundItem foundItem);
        public Task AddLostItem(LostItem lostItem);
        public Task AddNotification(Notification notification);
        public Task<List<FoundItem>> GetAllFoundItems();
        public List<LostItem> GetAllLostItems();
        public Task<List<FoundItem>> GetFoundItemsById(Guid id);
        public List<LostItem> GetLostItemsById(Guid email);
        public Task<List<Notification>> GetNotification(NotificationToAddDTO notificationToAddDTO);
        public Task<List<Notification>> GetNotificationsByUserId(Guid id);
        public Task InvertNotificationAsRead(Guid notificationId);
    }
}
