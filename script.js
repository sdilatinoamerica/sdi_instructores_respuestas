
        const questions = [
            "Queremos que te presentes: Te proponemos. 'Hola, soy [tu nombre], instructor SDI en [nombre del centro de buceo], y te quiero dar la bienvenida a #OneDiveFamily'",
            "¿Desde dónde estás buceando y trabajando? (Mencionar país, ciudad y el centro de buceo]",
            "¿Por qué elegiste a SDI para tu carrera profesional y qué diferencia hace en tu enseñanza",
            "¿Qué significa para ti el eslogan 'One Dive Family' de SDI?",
            "¿Cuál es el curso de SDI que más disfrutas enseñar y por qué?",
            "¿Cuál es tu certificación SDI/TDI/ERDI de mayor nivel y en qué área te destacas más como mentor/entrenador?",
            "¿Cuál ha sido el momento más gratificante o desafiante que has tenido mientras enseñabas un curso de SDI?",
            "¿Qué consejo le darías a alguien que está pensando en convertirse en Instructor SDI o en alcanzar su nivel más alto?",
            "¿Qué mensaje le darías a alguien que está pensando en venir a bucear con vos?",
            "En una frase: ¿qué significa para vos ser instructor SDI?"
        ];

        const TIME_LIMIT = 60; // seconds
        
        let currentQuestion = 0;
        let mediaRecorder;
        let videoChunks = [];
        let isRecording = false;
        let recordingTimer;
        let recordingTime = 0;
        let recordings = {};
        let instructorData = {};
        let stream;
        let currentVideoBlob;
        let instructorDatabase = []; // Simulate database
        let recordingStartTime = 0; // Nuevo: Para calcular duración real

        async function startTestimonials() {
            // Validate form
            const name = document.getElementById('instructorName').value.trim();
            const centerName = document.getElementById('diveCenterName').value.trim();
            
            if (!name || !centerName) {
                alert('Por favor completa al menos tu nombre y el nombre del centro de buceo.');
                return;
            }
            
            instructorData = {
                name: name,
                centerName: centerName,
                email: document.getElementById('instructorEmail').value.trim(),
                phone: document.getElementById('instructorPhone').value.trim(),
                location: document.getElementById('instructorLocation').value.trim(),
                instagram: document.getElementById('instagramHandle').value.trim(),
                timestamp: new Date().toISOString(),
                sessionId: generateSessionId()
            };
            
            // Save instructor data to "database"
            saveInstructorData(instructorData);
            
            try {
                // Request camera access
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 1280 }, 
                        height: { ideal: 720 },
                        facingMode: 'user'
                    }, 
                    audio: true 
                });
                
                document.getElementById('welcomeScreen').style.display = 'none';
                document.getElementById('questionScreen').style.display = 'block';
                
                const videoPreview = document.getElementById('videoPreview');
                videoPreview.srcObject = stream;
                
                showQuestion(0);
                
            } catch (err) {
                console.error('Error accessing camera:', err);
                alert('Error al acceder a la cámara. Por favor, permite el acceso a la cámara y micrófono e intenta de nuevo.');
            }
        }

        function generateSessionId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        function saveInstructorData(data) {
            // In a real implementation, this would save to a database
            instructorDatabase.push(data);
            console.log('Instructor data saved:', data);
        }

        function showQuestion(index) {
            currentQuestion = index;
            document.getElementById('questionNumber').textContent = `Pregunta ${index + 1} de ${questions.length}`;
            document.getElementById('questionText').textContent = questions[index];
            
            // Update progress
            const progress = ((index + 1) / questions.length) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            
            // Update navigation buttons
            document.getElementById('prevBtn').disabled = index === 0;
            document.getElementById('nextBtn').textContent = index === questions.length - 1 ? 'Finalizar' : 'Siguiente →';
            
            // Reset UI for new question
            resetRecordingUI();
            showExistingRecording(index);
        }

        function showExistingRecording(index) {
            const videoContainer = document.getElementById('videoContainer');
            const videoPreview = document.getElementById('videoPreview');
            const videoOverlay = document.getElementById('videoOverlay');
            const videoControls = document.getElementById('videoControls');
            
            if (recordings[index]) {
                // Don't show recorded video thumbnail, just show live preview with overlay message
                videoPreview.srcObject = stream;
                videoPreview.src = '';
                videoPreview.muted = true;
                
                // Show overlay with recorded status instead of playing video
                videoOverlay.style.display = 'flex';
                videoOverlay.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
                        <p style="font-size: 1.2rem;">Respuesta grabada</p>
                        <p style="font-size: 1rem; opacity: 0.8;">${recordings[index].duration}s de duración</p>
                    </div>
                `;
                
                videoControls.style.display = 'block';
                document.getElementById('recordingStatus').innerHTML = `✅ Respuesta grabada (${recordings[index].duration}s)`;
            } else {
                // Show live preview
                videoPreview.srcObject = stream;
                videoPreview.src = '';
                videoPreview.muted = true;
                videoOverlay.style.display = 'flex';
                videoOverlay.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">🎥</div>
                        <p style="font-size: 1.2rem;">Presiona "Grabar" para comenzar</p>
                    </div>
                `;
                videoControls.style.display = 'none';
                document.getElementById('recordingStatus').innerHTML = '';
            }
        }

        async function toggleRecording() {
            if (!isRecording) {
                await startRecording();
            } else {
                stopRecording();
            }
        }

        async function startRecording() {
            try {
                videoChunks = [];
                recordingStartTime = Date.now(); // Capturar tiempo de inicio
                
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp9,opus'
                });
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        videoChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
                    const videoUrl = URL.createObjectURL(videoBlob);
                    const actualDuration = Math.round((Date.now() - recordingStartTime) / 1000); // Calcular duración real
                    
                    recordings[currentQuestion] = {
                        blob: videoBlob,
                        url: videoUrl,
                        duration: actualDuration
                    };
                    
                    currentVideoBlob = videoBlob;
                    showExistingRecording(currentQuestion);
                };
                
                mediaRecorder.start();
                isRecording = true;
                recordingTime = TIME_LIMIT; // Start countdown from 45
                
                // Update UI
                const recordBtn = document.getElementById('recordBtn');
                recordBtn.textContent = '⏹️ Detener Grabación';
                recordBtn.classList.add('recording');
                
                document.getElementById('videoOverlay').style.display = 'none';
                document.getElementById('recordingStatus').innerHTML = '🔴 Grabando...';
                document.getElementById('timer').style.display = 'block';
                
                updateTimerDisplay(recordingTime);
                
                // Start countdown timer
                recordingTimer = setInterval(() => {
                    recordingTime--;
                    updateTimerDisplay(recordingTime);
                    
                    // Auto-stop at 0 seconds
                    if (recordingTime <= 0) {
                        stopRecording();
                    }
                }, 1000);
                
            } catch (err) {
                console.error('Error starting recording:', err);
                alert('Error al iniciar la grabación. Inténtalo de nuevo.');
            }
        }

        function updateTimerDisplay(timeLeft) {
            const timerElement = document.getElementById('timer');
            timerElement.textContent = timeLeft.toString().padStart(2, '0');
            
            // Remove all color classes
            timerElement.classList.remove('green', 'yellow', 'red');
            
            // Add appropriate color class
            if (timeLeft > 30) {
                timerElement.classList.add('green');
            } else if (timeLeft > 10) {
                timerElement.classList.add('yellow');
            } else {
                timerElement.classList.add('red');
            }
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                clearInterval(recordingTimer);
                resetRecordingUI();
            }
        }

        function resetRecordingUI() {
            const recordBtn = document.getElementById('recordBtn');
            recordBtn.textContent = '🔴 Grabar Respuesta';
            recordBtn.classList.remove('recording');
            
            const timerElement = document.getElementById('timer');
            timerElement.style.display = 'none';
            timerElement.classList.remove('green', 'yellow', 'red');
        }

        function retakeVideo() {
            deleteRecording();
            showExistingRecording(currentQuestion);
        }

        function deleteRecording() {
            if (recordings[currentQuestion]) {
                URL.revokeObjectURL(recordings[currentQuestion].url);
                delete recordings[currentQuestion];
                showExistingRecording(currentQuestion);
            }
        }

        function previousQuestion() {
            if (currentQuestion > 0) {
                showQuestion(currentQuestion - 1);
            }
        }

        function nextQuestion() {
            // Check if current question has been answered
            if (!recordings[currentQuestion]) {
                showWarningModal();
                return;
            }
            
            if (currentQuestion < questions.length - 1) {
                showQuestion(currentQuestion + 1);
            } else {
                completeTestimonials();
            }
        }

        function showWarningModal() {
            const modal = document.getElementById('warningModal');
            const message = document.getElementById('modalMessage');
            message.textContent = `No se ha grabado respuesta para la pregunta ${currentQuestion + 1}. ¿Deseas grabar una respuesta o continuar sin ella?`;
            modal.style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('warningModal').style.display = 'none';
        }

        function continueAnyway() {
            closeModal();
            if (currentQuestion < questions.length - 1) {
                showQuestion(currentQuestion + 1);
            } else {
                completeTestimonials();
            }
        }

        function completeTestimonials() {
            // Stop camera stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            document.getElementById('questionScreen').style.display = 'none';
            document.getElementById('completeScreen').style.display = 'block';
            
            const recordedCount = Object.keys(recordings).length;
            document.getElementById('summaryCount').textContent = recordedCount;
            document.getElementById('summaryInstructor').textContent = `${instructorData.name} - ${instructorData.centerName}`;
        }

        async function downloadTestimonials() {
            try {
                // Show loading message
                const downloadBtn = document.querySelector('.download-btn');
                const originalText = downloadBtn.textContent;
                downloadBtn.textContent = '📥 Generando archivo...';
                downloadBtn.disabled = true;
                
                // Show alert about processing time
                alert('El archivo ZIP se está generando, puede tomar unos segundos. Presiona "Aceptar" y espera a que se descargue automáticamente.');
                
                const zip = new JSZip();
                
                // Add instructor data
                const instructorInfo = {
                    ...instructorData,
                    totalQuestions: questions.length,
                    answeredQuestions: Object.keys(recordings).length,
                    questions: questions,
                    responses: Object.keys(recordings).map(q => parseInt(q) + 1)
                };
                
                zip.file('instructor_data.json', JSON.stringify(instructorInfo, null, 2));
                
                // Add summary file
                let summaryText = `VIDEO TESTIMONIALS SDI - ${instructorData.name}\n`;
                summaryText += `==========================================\n\n`;
                summaryText += `Centro de Buceo: ${instructorData.centerName}\n`;
                if (instructorData.email) summaryText += `Email: ${instructorData.email}\n`;
                if (instructorData.phone) summaryText += `Teléfono: ${instructorData.phone}\n`;
                if (instructorData.location) summaryText += `Ubicación: ${instructorData.location}\n`;
                if (instructorData.instagram) summaryText += `Instagram: ${instructorData.instagram}\n`;
                summaryText += `Fecha: ${new Date().toLocaleDateString()}\n`;
                summaryText += `ID de Sesión: ${instructorData.sessionId}\n`;
                summaryText += `Total de videos: ${Object.keys(recordings).length}\n\n`;
                
                summaryText += `PREGUNTAS Y RESPUESTAS:\n`;
                summaryText += `========================\n\n`;
                
                for (let i = 0; i < questions.length; i++) {
                    summaryText += `${i + 1}. ${questions[i]}\n`;
                    summaryText += recordings[i] ? 
                        `   ✅ Respondida (${recordings[i].duration}s)\n   Archivo: Q${i + 1}_${instructorData.name.replace(/\s+/g, '_')}.webm\n\n` : 
                        `   ❌ Sin responder\n\n`;
                }
                
                summaryText += `\nNOTAS:\n`;
                summaryText += `- Los videos están en formato WebM\n`;
                summaryText += `- Límite de tiempo por respuesta: 45 segundos\n`;
                summaryText += `- Para subir a Drive: ${window.location.origin}/drive-upload\n`;
                
                zip.file('README.txt', summaryText);
                
                // Add video files
                for (const [questionIndex, recording] of Object.entries(recordings)) {
                    const fileName = `Q${parseInt(questionIndex) + 1}_${instructorData.name.replace(/\s+/g, '_')}.webm`;
                    zip.file(fileName, recording.blob);
                }
                
                // Generate and download ZIP
                const zipBlob = await zip.generateAsync({
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: { level: 6 }
                });
                
                const zipUrl = URL.createObjectURL(zipBlob);
                const link = document.createElement('a');
                link.href = zipUrl;
                const today = new Date().toISOString().split('T')[0];
                link.download = `${instructorData.centerName.replace(/\s+/g, '_')}_${today}.zip`;
                link.click();
                
                URL.revokeObjectURL(zipUrl);
                alert('¡ZIP descargado exitosamente! Encontrarás el archivo en tu carpeta de descargas.');
                
                // Restore button
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
                
            } catch (error) {
                console.error('Error creating ZIP:', error);
                alert('Error al crear el archivo ZIP. Inténtalo de nuevo.');
                
                // Restore button in case of error
                const downloadBtn = document.querySelector('.download-btn');
                downloadBtn.textContent = '📥 Descargar ZIP de Respaldo';
                downloadBtn.disabled = false;
            }
        }

        function restartTestimonials() {
            // Clean up
            Object.values(recordings).forEach(recording => {
                URL.revokeObjectURL(recording.url);
            });
            recordings = {};
            instructorData = {};
            currentQuestion = 0;
            
            // Stop any existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            
            // Reset form
            document.getElementById('instructorName').value = '';
            document.getElementById('diveCenterName').value = '';
            document.getElementById('instructorEmail').value = '';
            document.getElementById('instructorPhone').value = '';
            document.getElementById('instructorLocation').value = '';
            document.getElementById('instagramHandle').value = '';
            
            // Show welcome screen
            document.getElementById('completeScreen').style.display = 'none';
            document.getElementById('welcomeScreen').style.display = 'block';
        }

        // Export instructor data for admin panel
        function exportInstructorDatabase() {
            const dataStr = JSON.stringify(instructorDatabase, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'sdi_instructors_database.json';
            link.click();
            URL.revokeObjectURL(url);
        }

        // Handle page unload
        window.addEventListener('beforeunload', function(e) {
            if (isRecording) {
                e.preventDefault();
                e.returnValue = 'Tienes una grabación en curso. ¿Estás seguro de salir?';
                return e.returnValue;
            }
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            Object.values(recordings).forEach(recording => {
                URL.revokeObjectURL(recording.url);
            });
        });

        // Console commands for debugging
        window.sdiAdmin = {
            exportDatabase: exportInstructorDatabase,
            viewDatabase: () => console.log(instructorDatabase),
            clearDatabase: () => instructorDatabase = [],
            getCurrentSession: () => instructorData,
            getRecordings: () => recordings
        };

