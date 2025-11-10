using Lost_And_Found_Web_Portal.Core.Domain.IdentityEntities;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Lost_And_Found_Web_Portal.Api.Controllers
{
    [Route("[controller]/[action]")]
    [ApiController]
    [Authorize(Roles = "Admin,User")]
    public class LostAndFoundController : ControllerBase
    {
        private readonly ILogger<LostAndFoundController> _logger;
        private readonly ILostAndFoundService _lostAndFoundService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _webHostEnvironment;
        public LostAndFoundController(ILogger<LostAndFoundController> logger, ILostAndFoundService lostAndFoundService, UserManager<ApplicationUser> userManager, IWebHostEnvironment webHostEnvironment)
        {
            _logger = logger;
            _lostAndFoundService = lostAndFoundService;
            _userManager = userManager;
            _webHostEnvironment = webHostEnvironment;
        }


        #region LostModulo

        [HttpPost]
        public async Task<IActionResult> AddLostItem(LostItemToAddDTO lostItemToAddDTO)
        {
            if (lostItemToAddDTO == null)
            {
                return BadRequest("Lost item data is null.");
            }

            LostItemToShowDTO lostItemToShowDTO = new LostItemToShowDTO();
            try
            {
                var email = User.FindFirst("userEmail")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

                var user = await _userManager.FindByEmailAsync(email);

                if (user == null)
                {
                    return Unauthorized();
                }

                string ownerName = user.PersonName;
                Guid ownerId = user.Id;
                lostItemToShowDTO = await _lostAndFoundService.AddLostItemAsync(lostItemToAddDTO,ownerName,ownerId,_webHostEnvironment.WebRootPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while adding lost item.");
                return StatusCode(500, "Internal server error");
            }

            return Ok(lostItemToShowDTO);
        }



        [HttpGet]
        public async Task<IActionResult> GetLostItems()
        {
            List<LostItemToShowDTO> lostItems =await _lostAndFoundService.GetAllLostItemx(_webHostEnvironment.WebRootPath);
            return Ok(lostItems);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyLostItemsPost()
        {
            var email = User.FindFirst("userEmail")?.Value
                  ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            ApplicationUser user = await _userManager.FindByEmailAsync(email);
            List<LostItemToShowDTO> lostItemToShow=await _lostAndFoundService.GetLostItemById(_webHostEnvironment.WebRootPath,user.Id);
            return Ok(lostItemToShow);
        }

        #endregion



        #region FoundModulo


        [HttpPost]
        public async Task<IActionResult> AddFoundItem(FoundItemToAddDTO foundItemToAddDTO)
        {
            if (foundItemToAddDTO == null)
            {
                return BadRequest("Found item data is null.");
            }

            FoundItemToShowDTO foundItemToShowDTO = new FoundItemToShowDTO();
            try
            {
                var email = User.FindFirst("userEmail")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

                var user = await _userManager.FindByEmailAsync(email);

                if (user == null)
                {
                    return Unauthorized();
                }

                string ownerName = user.PersonName;
                Guid ownerId = user.Id;
                foundItemToShowDTO = await _lostAndFoundService.AddFoundItemAsync(foundItemToAddDTO, ownerName, ownerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while adding lost item.");
                return StatusCode(500, "Internal server error");
            }

            return Ok(foundItemToShowDTO);
        }


        [HttpGet]
        public async Task<IActionResult> GetFoundItems()
        {
            List<FoundItemToShowDTO> foundItems = await _lostAndFoundService.GetAllFoundItem();
            return Ok(foundItems);
        }


        [HttpGet]
        public async Task<IActionResult> GetMyFoundItemsPost()
        {
            var email = User.FindFirst("userEmail")?.Value
                  ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            ApplicationUser user = await _userManager.FindByEmailAsync(email);
            List<FoundItemToShowDTO> foundItemToShow = await _lostAndFoundService.GetFoundItemById(user.Id);
            return Ok(foundItemToShow);
        }



        [HttpGet]
        public async Task<IActionResult> GetFoundItemsByFiltering([FromQuery] FilterAttributesDTO filterAttributesDTO)
        {
            List<FoundItemToShowDTO> foundItems = await _lostAndFoundService.GetFilteredFoundItem(filterAttributesDTO);
            return Ok(foundItems);
        }




        #endregion


        #region NotificationModulo


        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var email = User.FindFirst("userEmail")?.Value
                  ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            ApplicationUser user = await _userManager.FindByEmailAsync(email);
            List<NotificationToShowDTO> notificationToShow = await _lostAndFoundService.GetNotificationsByUserId(user.Id);
            return Ok(notificationToShow);
        }

        [HttpPost]
        public async Task IsRead([FromBody] Guid NotificationId)
        {
            await _lostAndFoundService.InvertNotificationAsRead(NotificationId);
        }

        #endregion

    }
}
