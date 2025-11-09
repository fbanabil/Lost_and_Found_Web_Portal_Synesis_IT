using Lost_And_Found_Web_Portal.Api.Filters;
using Lost_And_Found_Web_Portal.Core.Domain.IdentityEntities;
using Lost_And_Found_Web_Portal.Core.DTO;
using Lost_And_Found_Web_Portal.Core.Enums;
using Lost_And_Found_Web_Portal.Core.Helpers;
using Lost_And_Found_Web_Portal.Core.ServiceContracts;
using Lost_And_Found_Web_Portal.Infrastructure.DbContext;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Security.Claims;

namespace Lost_And_Found_Web_Portal.Api.Controllers
{
    [Route("[controller]/[action]")]
    [ApiController]
    [TypeFilter(typeof(ModelStateHandleFilter))]
    //[AllowAnonymous]
    public class AuthenticationController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly ILogger<AuthenticationController> _logger;
        private readonly IAuthService _authenticationService;

        public AuthenticationController(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager, ILogger<AuthenticationController> logger, IAuthService authenticationService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
            _authenticationService = authenticationService;
        }



        // User Registration
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterUser(RegisterDTO registerDTO)
        {
            
            ApplicationUser user = new ApplicationUser
            {
                UserName = registerDTO.Email,
                Email = registerDTO.Email,
                PersonName = registerDTO.PersonName,
                PhoneNumber = registerDTO.PhoneNumber,
            };

            IdentityResult result = await _userManager.CreateAsync(user, registerDTO.Password);

            if(result.Succeeded)
            {
                if(!await _roleManager.RoleExistsAsync("User"))
                {
                    ApplicationRole userRole = new ApplicationRole
                    {
                        Name = UserTypes.User.ToString()
                    };
                    await _roleManager.CreateAsync(userRole);
                }
                await _userManager.AddToRoleAsync(user, UserTypes.User.ToString());
                List<String> roles =  _userManager.GetRolesAsync(user).Result.ToList();
                string token = await _authenticationService.GetToken(user.Email, roles);
                return Ok(new {message = "Register Successfull",token, personName = user.PersonName });
            }
            else
            {
                _logger.LogWarning("User registration failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                return BadRequest(result.Errors);
            }

        }



        // Admin Registration using Secure Api
        [HttpPost("/SecuredApiCode/[action]")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterAdmin(RegisterDTO registerDTO)
        {

            ApplicationUser admin = new ApplicationUser
            {
                UserName = registerDTO.Email,
                Email = registerDTO.Email,
                PersonName = registerDTO.PersonName,
                PhoneNumber = registerDTO.PhoneNumber,
            };

            IdentityResult result = await _userManager.CreateAsync(admin, registerDTO.Password);

            if (result.Succeeded)
            {
                if (!await _roleManager.RoleExistsAsync("Admin"))
                {
                    ApplicationRole userRole = new ApplicationRole
                    {
                        Name = UserTypes.Admin.ToString()
                    };
                    await _roleManager.CreateAsync(userRole);
                }
                await _userManager.AddToRoleAsync(admin, UserTypes.Admin.ToString());



                return Ok("User registered successfully.");
            }
            else
            {
                _logger.LogWarning("User registration failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                return BadRequest(result.Errors);
            }

        }


        // Login
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDTO loginDTO)
        {
            ApplicationUser? user = await _userManager.FindByEmailAsync(loginDTO.UserName);

            if(user != null && await _userManager.CheckPasswordAsync(user, loginDTO.Password))
            {
                List<String> roles = _userManager.GetRolesAsync(user).Result.ToList();
                string token = await _authenticationService.GetToken(user.Email, roles);

                _logger.LogInformation("Login successful for user: {UserName}", loginDTO.UserName);
                return Ok(new { message = "Login Success", token, personName = user.PersonName });
            }
            else
            {
                _logger.LogWarning("Login failed for user: {UserName}", loginDTO.UserName);
                return Unauthorized("Invalid username or password.");
            }
        }


        // Logout
        [HttpPost]
        [Authorize(Roles ="User,Admin")]
        public async Task<IActionResult> Logout()
        {
            string? token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (token == null)
            {
                _logger.LogInformation("No Token");
            }

            _logger.LogInformation("Token Found");

            if (token != null)
            {
                bool isBlacklisted = await _authenticationService.BlackListToken(token);
                if (isBlacklisted)
                {
                    _logger.LogInformation("Logout successful and token blacklisted.");
                    return Ok("Logout successful.");
                }
                else
                {
                    _logger.LogWarning("Failed to blacklist token during logout.");
                    return StatusCode(StatusCodes.Status500InternalServerError, "Failed to logout.");
                }
            }
            else
            {
                _logger.LogWarning("No token found in request headers during logout.");
                return BadRequest("No token found.");
            }
        }

    }
}
