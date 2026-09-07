// 👑 ল্যান্ডিং পেজের ক্লিন টেমপ্লেট
export const landingPageTemplate = (): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smart Power Grid API</title>
        <!-- FontAwesome Icons for Dashboard Styling -->
        <link rel="stylesheet" href="https://cloudflare.com">
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @keyframes pulse-slow {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.9; }
            }
            .grid-bg {
                background-image: linear-gradient(rgba(0, 242, 254, 0.05) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(0, 242, 254, 0.05) 1px, transparent 1px);
                background-size: 30px 30px;
            }
        </style>
    </head>
    <body class="bg-[#0B132B] text-gray-100 font-sans min-h-screen flex flex-col justify-between relative overflow-hidden grid-bg">
        
        <!-- Glowing Core -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <!-- Main Container -->
        <main class="container mx-auto px-6 pt-16 pb-8 flex-grow flex flex-col items-center justify-center max-w-4xl relative z-10">
            
            <!-- Animated Icon -->
            <div class="mb-6 relative">
                <div class="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-40 animate-ping"></div>
                <div class="bg-gradient-to-tr from-cyan-500 to-blue-600 p-5 rounded-full shadow-lg shadow-cyan-500/30 relative">
                    <i class="fa-solid fa-bolt text-4xl text-white"></i>
                </div>
            </div>

            <!-- Title & Status -->
            <h1 class="text-3xl md:text-4xl font-extrabold text-center tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Smart Power Grid Management System
            </h1>
            <p class="text-gray-400 text-sm md:text-base font-medium mb-8 tracking-wider uppercase flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                Core Production Backend API v1.0.0
            </p>

            <!-- Metrics / Info Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10">
                <div class="bg-[#1C2541]/60 backdrop-blur-md border border-gray-800 p-5 rounded-xl hover:border-cyan-500/30 transition duration-300">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-semibold text-gray-400 tracking-wider uppercase">System Status</span>
                        <i class="fa-solid fa-circle-check text-emerald-400"></i>
                    </div>
                    <p class="text-xl font-bold text-white tracking-tight">Fully Operational</p>
                </div>

                <div class="bg-[#1C2541]/60 backdrop-blur-md border border-gray-800 p-5 rounded-xl hover:border-cyan-500/30 transition duration-300">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-semibold text-gray-400 tracking-wider uppercase">Secure Gateway</span>
                        <i class="fa-solid fa-shield-halved text-cyan-400"></i>
                    </div>
                    <p class="text-xl font-bold text-white tracking-tight">SSL / JWT Active</p>
                </div>

                <div class="bg-[#1C2541]/60 backdrop-blur-md border border-gray-800 p-5 rounded-xl hover:border-cyan-500/30 transition duration-300">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-semibold text-gray-400 tracking-wider uppercase">Database Sync</span>
                        <i class="fa-solid fa-database text-blue-400"></i>
                    </div>
                    <p class="text-xl font-bold text-white tracking-tight">Prisma Connected</p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-4 justify-center">
                <a href="/api/v1/docs" class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-6 py-3 rounded-lg font-semibold text-sm transition duration-300 shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                    <i class="fa-solid fa-book"></i> API Documentation
                </a>
                <a href="/api/v1/health" class="bg-[#1C2541] hover:bg-[#253154] border border-gray-700 px-6 py-3 rounded-lg font-semibold text-sm transition duration-300 flex items-center gap-2">
                    <i class="fa-solid fa-heartbeat text-rose-500"></i> Health Check
                </a>
            </div>
        </main>

        <!-- Footer -->
        <footer class="w-full border-t border-gray-900 py-4 bg-[#080E21]/80 text-center text-xs text-gray-500 z-10">
            &copy; ${new Date().getFullYear()} Smart Power Grid. All Rights Reserved. Secure Infrastructure.
        </footer>
    </body>
    </html>
  `;
};
