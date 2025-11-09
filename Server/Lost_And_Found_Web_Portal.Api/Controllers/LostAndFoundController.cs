using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Lost_And_Found_Web_Portal.Api.Controllers
{
    [Route("[controller]/[action]")]
    [ApiController]
    [Authorize]
    public class LostAndFoundController : ControllerBase
    {
        private readonly ILogger<LostAndFoundController> _logger;
        private readonly ILostAndFoundService _lostAndFoundService;
        public LostAndFoundController(ILogger<LostAndFoundController> logger, ILostAndFoundService lostAndFoundService)
        {
            _logger = logger;
            _lostAndFoundService = lostAndFoundService;
        }




    }
}
