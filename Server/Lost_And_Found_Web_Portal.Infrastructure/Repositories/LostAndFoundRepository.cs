using Lost_And_Found_Web_Portal.Core.Domain.Entities;
using Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts;
using Lost_And_Found_Web_Portal.Infrastructure.DbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Lost_And_Found_Web_Portal.Infrastructure.Repositories
{
    public class LostAndFoundRepository : ILostAndFoundRepository
    {
        private readonly ApplicationDbContext _dbContext;
        public LostAndFoundRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Task AddLostItem(LostItem lostItem)
        {
            try
            {
                _dbContext.LostItems.Add(lostItem);
                _dbContext.SaveChanges();
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to add lost item to the database: {ex.Message}", ex);
            }
        }

        public List<LostItem> GetAllLostItems()
        {
            return _dbContext.LostItems.ToList();
        }

        public List<LostItem> GetLostItemsById(Guid id)
        {
            return _dbContext.LostItems
                .Where(x => x.OwnerId == id).ToList();
        }
    }
}
