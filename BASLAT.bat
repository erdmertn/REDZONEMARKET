@echo off
chcp 65001 > nul
title RedZone Market - Oyun ve Key Satış Sunucusu
echo ========================================================
echo   🎮 REDZONE MARKET - DİJİTAL OYUN & KEY SATIŞ SİSTEMİ
echo   🌍 Domain: https://redzonemartket.com.tr
echo ========================================================
echo.
echo Sunucu başlatılıyor...
echo.
echo Mağaza: http://localhost:3000
echo Yönetici Paneli: http://localhost:3000/admin.html
echo Varsayılan PIN: admin123
echo.
echo Kapatmak için bu pencereyi kapatabilir veya CTRL+C yapabilirsiniz.
echo ========================================================
echo.
node server.js
pause
