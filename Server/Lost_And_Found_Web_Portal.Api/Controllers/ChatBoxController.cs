using Lost_And_Found_Web_Portal.Core.Domain.IdentityEntities;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Lost_And_Found_Web_Portal.Api.Controllers
{
    [Route("[controller]/[action]")]
    [ApiController]
    [Authorize(Roles = "Admin,User")]
    public class ChatBoxController : ControllerBase
    {
        private readonly ILogger<ChatBoxController> _logger;
        private readonly IChatBoxServices _chatBoxServices;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _webHostEnvironment;
        public ChatBoxController(ILogger<ChatBoxController> logger, IChatBoxServices chatBoxServices, UserManager<ApplicationUser> userManager, IWebHostEnvironment webHostEnvironment)
        {
            _logger = logger;
            _chatBoxServices = chatBoxServices;
            _userManager = userManager;
            _webHostEnvironment = webHostEnvironment;
        }


        [HttpPost]
        public async Task<IActionResult> InitiatChatThread(ThreadToAddDto threadToAddDto)
        {
            var email = User.FindFirst("userEmail")?.Value
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            ApplicationUser? user = await _userManager.FindByEmailAsync(email);



            bool exist = await _chatBoxServices.ExistThread(threadToAddDto.ReceiverId,user.Id);

            if (exist==true)
            {
                return Ok();
            }

            
            if (user.Id==threadToAddDto.ReceiverId)
            {
                return BadRequest("You cant Chat With Yourself");
            }


            threadToAddDto.SenderId = user.Id;
            ThreadToShowDTO threadToShowDTO = await _chatBoxServices.InitiateThread(threadToAddDto);

            return Ok(threadToShowDTO);
        }


        [HttpGet]
        public async Task<IActionResult> GetSortedThreads()
        {
            var email = User.FindFirst("userEmail")?.Value
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            ApplicationUser? user = await _userManager.FindByEmailAsync(email);

            if (user==null)
            {
                return BadRequest("Login First");
            }

            List<ThreadToShowDTO> threadToShowDTOs = await _chatBoxServices.GetSortedThreadsByUserId(user.Id);
            return Ok(threadToShowDTOs);
        }

        [HttpGet("{threadId}")]
        public async Task<IActionResult> GetMessagesByThreadId(Guid threadId)
        {
            string webRootPath = _webHostEnvironment.WebRootPath;

            List<ChatToShowDTO> chatToShowDTOs = await _chatBoxServices.GetChatByThreadId(threadId,webRootPath);
            return Ok(chatToShowDTOs);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage(ChatToAddDTO chatToAddDTO)
        {
            var email = User.FindFirst("userEmail")?.Value
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            ApplicationUser? user = await _userManager.FindByEmailAsync(email);

            chatToAddDTO.SenderId = user.Id;

            string webRootPath = _webHostEnvironment.WebRootPath;
            ChatToShowDTO chatToShowDTO = await _chatBoxServices.AddChat(chatToAddDTO, webRootPath);
            return Ok(chatToShowDTO);
        }


    }
}
