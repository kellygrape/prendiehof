import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Alert,
  Drawer,
  IconButton,
  Divider,
  Stack,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  HowToVote as VoteIcon,
} from "@mui/icons-material";
import { peopleAPI, ballotAPI } from "../utils/api";
import type { Person, Nomination, BallotSelection } from "../types";

function Ballot() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingNominations, setLoadingNominations] = useState(false);

  const MAX_SELECTIONS = 8;

  useEffect(() => {
    loadBallotData();
  }, []);

  const loadBallotData = async () => {
    try {
      const [peopleData, selectionsData] = await Promise.all([
        peopleAPI.getAll(),
        ballotAPI.getMySelections(),
      ]);

      setPeople(peopleData);

      const selected = new Set(selectionsData.map((s) => `${s.person_name}|${s.person_year}`));
      setSelectedPeople(selected);
    } catch (err) {
      setError("Failed to load ballot data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelection = (person: Person) => {
    const key = `${person.name}|${person.year}`;
    const newSelected = new Set(selectedPeople);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      if (newSelected.size >= MAX_SELECTIONS) {
        setError(`You can only select up to ${MAX_SELECTIONS} people`);
        setTimeout(() => setError(""), 3000);
        return;
      }
      newSelected.add(key);
    }

    setSelectedPeople(newSelected);
    setSuccess("");
  };

  const handleViewNominations = async (person: Person) => {
    setLoadingNominations(true);
    setViewingPerson(person);
    try {
      const noms = await peopleAPI.getNominations(person.name, person.year);
      setNominations(noms);
    } catch (err) {
      setError("Failed to load nominations");
      console.error(err);
    } finally {
      setLoadingNominations(false);
    }
  };

  const handleSubmitBallot = async () => {
    if (selectedPeople.size === 0) {
      setError("Please select at least one person");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const selections: BallotSelection[] = Array.from(selectedPeople).map((key) => {
        const [person_name, person_year] = key.split("|");
        return { person_name, person_year };
      });

      await ballotAPI.saveSelections(selections);
      setSuccess(`Ballot saved! You selected ${selections.length} of ${MAX_SELECTIONS} people.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save ballot";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (person: Person): boolean => {
    return selectedPeople.has(`${person.name}|${person.year}`);
  };

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              Your Ballot
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
              Select up to {MAX_SELECTIONS} people to induct into the Hall of Fame. You can read
              their nominations before deciding.
            </Typography>
          </Box>

          {/* Counter Badge */}
          <Paper
            elevation={3}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              p: 3,
              borderRadius: 2,
              textAlign: "center",
              minWidth: 140,
            }}
          >
            <Typography variant="h2" fontWeight="bold" sx={{ lineHeight: 1 }}>
              {selectedPeople.size}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              of {MAX_SELECTIONS} selected
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Submit Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <VoteIcon />}
          onClick={handleSubmitBallot}
          disabled={saving || selectedPeople.size === 0}
        >
          {saving ? "Saving..." : "Submit Ballot"}
        </Button>
      </Box>

      {/* People List */}
      <Grid container spacing={2}>
        {people.map((person) => {
          const selected = isSelected(person);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${person.name}|${person.year}`}>
              <Card
                variant="outlined"
                sx={{
                  border: selected ? 2 : 1,
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected ? "primary.50" : "background.paper",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Checkbox and Info */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flex: 1,
                        minWidth: 250,
                      }}
                    >
                      <Checkbox
                        checked={selected}
                        onChange={() => handleToggleSelection(person)}
                        size="large"
                        icon={
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              border: 2,
                              borderColor: "grey.400",
                              borderRadius: 1,
                            }}
                          />
                        }
                        checkedIcon={<CheckCircleIcon />}
                      />
                      <Box>
                        <Typography variant="h6" component="h3">
                          {person.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Class of {person.year}
                        </Typography>
                        <Chip
                          label={`${person.nomination_count} nomination${
                            person.nomination_count > 1 ? "s" : ""
                          }`}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>

                    {/* View Button */}
                    <Button variant="outlined" onClick={() => handleViewNominations(person)}>
                      View Nomination{person.nomination_count > 1 ? "s" : ""}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Side Drawer for Viewing Nominations */}
      <Drawer
        anchor="right"
        open={Boolean(viewingPerson)}
        onClose={() => setViewingPerson(null)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 600 }, maxWidth: "90vw" },
        }}
      >
        {viewingPerson && (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Drawer Header */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {viewingPerson.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Class of {viewingPerson.year} • {viewingPerson.nomination_count} nomination
                    {viewingPerson.nomination_count > 1 ? "s" : ""}
                  </Typography>
                </Box>
                <IconButton onClick={() => setViewingPerson(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Drawer Content */}
            <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
              {loadingNominations ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={3}>
                  {nominations.map((nom, index) => (
                    <Paper key={nom.id} elevation={2} sx={{ p: 3, bgcolor: "grey.50" }}>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Nomination {index + 1}
                      </Typography>

                      {nom.nomination_summary && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Summary
                          </Typography>
                          <Typography variant="body2" paragraph>
                            {nom.nomination_summary}
                          </Typography>
                        </Box>
                      )}

                      {nom.career_position && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Career / Position
                          </Typography>
                          <Typography variant="body2" paragraph>
                            {nom.career_position}
                          </Typography>
                        </Box>
                      )}

                      {/* Achievements Section */}
                      {(nom.professional_achievements ||
                        nom.professional_awards ||
                        nom.educational_achievements ||
                        nom.merit_awards) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Achievements
                          </Typography>

                          {nom.professional_achievements && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                color="text.secondary"
                              >
                                Professional Achievements
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {nom.professional_achievements}
                              </Typography>
                            </Box>
                          )}

                          {nom.professional_awards && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                color="text.secondary"
                              >
                                Awards & Honors
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {nom.professional_awards}
                              </Typography>
                            </Box>
                          )}

                          {nom.educational_achievements && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                color="text.secondary"
                              >
                                Educational Achievements
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {nom.educational_achievements}
                              </Typography>
                            </Box>
                          )}

                          {nom.merit_awards && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                color="text.secondary"
                              >
                                Merit Awards
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {nom.merit_awards}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Service Section */}
                      {(nom.service_church_community || nom.service_mbaphs) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Service
                          </Typography>

                          {nom.service_church_community && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                color="text.secondary"
                              >
                                Service to Church & Community
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {nom.service_church_community}
                              </Typography>
                            </Box>
                          )}

                          {nom.service_mbaphs && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                color="text.secondary"
                              >
                                Service to MBAPHS
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {nom.service_mbaphs}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Nominator Info */}
                      {nom.nominator_name && (
                        <Box
                          sx={{
                            mt: 3,
                            pt: 2,
                            borderTop: 1,
                            borderColor: "divider",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" display="block">
                            Nominated by: {nom.nominator_name}
                            {nom.nominator_email && ` • ${nom.nominator_email}`}
                            {nom.nominator_phone && ` • ${nom.nominator_phone}`}
                          </Typography>
                        </Box>
                      )}

                      {index < nominations.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </Drawer>
    </Container>
  );
}

export default Ballot;
