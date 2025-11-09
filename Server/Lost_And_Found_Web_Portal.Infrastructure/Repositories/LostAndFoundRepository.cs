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
    }
}
