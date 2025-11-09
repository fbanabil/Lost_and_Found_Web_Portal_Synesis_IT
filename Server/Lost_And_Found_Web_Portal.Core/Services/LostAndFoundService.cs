using Lost_And_Found_Web_Portal.Core.Domain.RepositoryContracts;
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

        public LostAndFoundService(ILogger<LostAndFoundService> logger, ILostAndFoundRepository lostAndFoundRepository)
        {
            _logger = logger;
            _lostAndFoundRepository = lostAndFoundRepository;
            _stringMatchHelper = new StringMatchHelper();
        }


    }
}
