import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const TokenExpirationPopup = ({ isOpen, onClose }) => {
    return (
        <Dialog 
            open={isOpen} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{
                style: {
                    borderRadius: '12px',
                    padding: '8px'
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <WarningAmberIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
                <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937' }}>
                    Sesi Berakhir
                </DialogTitle>
                <DialogContent sx={{ p: 0, textAlign: 'center' }}>
                    <DialogContentText sx={{ color: '#4b5563' }}>
                        Masa berlaku token Anda telah habis. Silakan login kembali untuk melanjutkan.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ width: '100%', p: 0, mt: 3 }}>
                    <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={onClose}
                        sx={{ 
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            backgroundColor: '#10b981',
                            '&:hover': {
                                backgroundColor: '#059669'
                            }
                        }}
                    >
                        Login Kembali
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default TokenExpirationPopup;
