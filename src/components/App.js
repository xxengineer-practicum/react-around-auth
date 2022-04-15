import React from 'react'
import { CurrentUserContext } from '../contexts/CurrentUserContext'
import { Route, Switch, useHistory } from 'react-router-dom'
import Header from './Header'
import Main from './Main'
import Footer from './Footer'
import Login from './Login'
import Register from './Register'
import InfoTooltip from './InfoTooltip'
import ProtectedRoute from './ProtectedRoute'
import EditProfilePopup from './EditProfilePopup'
import ImagePopup from './ImagePopup'
import api from '../utils/api'
import EditAvatarPopup from './EditAvatarPopup'
import AddPlacePopup from './AddPlacePopup'
import TrashPopup from './TrashPopup'
import { registrationStatuses } from '../utils/constants'
import * as auth from '../utils/auth'

function App() {
  const [isEditAvatarOpen, setIsEditAvatarOpen] = React.useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false)
  const [isAddPlaceOpen, setIsAddPlaceOpen] = React.useState(false)
  const [isConfirmTrashOpen, setIsConfirmTrashOpen] = React.useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isInfoToolTipOpen, setIsInfoToolTipOpen] = React.useState(false)

  const [infoStatus, setInfoStatus] = React.useState({})
  const [selectedCard, setSelectedCard] = React.useState({})
  const [currentUser, setCurrentUser] = React.useState({})
  const [cardList, setCardList] = React.useState([])
  const [isLoggedIn, setIsLoggedIn] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [toolTipStatus, setToolTipStatus] = React.useState(registrationStatuses[0])
  const history = useHistory()
  

  // Load in profile info -- currentUser state used for CurrentUserContext
  React.useEffect(() => {
    api.getProfileInfo()
      .then((info) => {
        setCurrentUser(info)
      })
      .catch(err => console.error(`Unable to load profile info: ${err}`))
  }, [])

  // Load in initial cards
  React.useEffect(() => {
    api.getCards()
    .then( (initialCards) => {
      setCardList([...initialCards])
    })
    .catch(err => console.error(`Unable to load cards: ${err}`))
  }, [])

  // Check token upon loading page
  React.useEffect(() => {
    handleToken()
  }, [])

  // Handle login submit 
  function onLogin(email, password) {
    auth.login(email, password)
      .then(res => {
        setIsLoggedIn(true)
        if (!localStorage.getItem('_id')) {
          handleToken()
        }
      })
      .then(res => history.push('/'))
      .catch(err => console.error(`An error occurred during login: ${err}`))
  }

  // Handle register submit
  function onRegister(email, password) {
    auth.register(email, password)
      .then(res => {
        // For Project 15 -- Add new user id to currentUser context
        // Note to self: may need a default avatar and name for project 15 on backend, or more signup fields.
        // const newUser = currentUser
        // newUser._id = res._id

        // set email then redirect to login page with email filled out.
        setEmail(res.email)
        setIsLoggedIn(true)
        history.push('/')
      })
      .then(res => {
        // load success message to info tool tip modal and open
        setInfoStatus(registrationStatuses[0])
      })
      .catch(err => {
        console.error(`An error occurred during signup: ${err}`)
        setInfoStatus(registrationStatuses[1])
      })
      .finally(setIsInfoToolTipOpen(true))
  }

  // Handle logout submit
  function onSignOut() {
    localStorage.removeItem('token')
    setEmail('')
    setIsLoggedIn(false)
    history.push('/signin')
  }

  function handleToken(token = localStorage.getItem('token')) {
    auth.checkToken(token)
      .then(res => {
        setEmail(res.data.email)
        setIsLoggedIn(true)
        // For Project 15, save _id to currentUser context
        // const data = currentUser
        // data._id = res._id
        // setCurrentUser(data)
        history.push('/')
      })
      .catch(err => `An error occurred during authentication: ${err}`)
  }

  // Open edit avatar modal
  function handleEditAvatarClick() {
    setIsEditAvatarOpen(true)
  }

  // Open edit profile modal
  function handleEditProfileClick() {
    setIsEditProfileOpen(true)
  }

  // Send new profile info from modal to server (name, about) then close modal
  function handleUpdateUser(userInfo) {
    api.saveProfile(userInfo)
      .then(data => {
        setCurrentUser(data)
      })
      .then(() => setIsEditProfileOpen(false))
      .catch(err => console.error(`Unable to save profile: ${err}`))
  }

  // Send new avatar to server then close modal
  function handleUpdateAvatar({ avatar }) {
    api.saveAvatar(avatar)
      .then(data => {
        setCurrentUser(data)
      })
      .then(() => setIsEditAvatarOpen(false))
      .catch(err => console.error(`Unable to save avatar: ${err}`))
  }

  // Open preview modal for selected card
  function handleCardClick(card) {
    setSelectedCard(card)
    setIsPreviewOpen(true)
  }

  // Open new card modal
  function handleAddPlaceClick() {
    setIsAddPlaceOpen(true)
  }

  // Send new card data to server, add to card list, then close modal
  function handleAddPlaceSubmit({ name, link }) {
    api.addCard({ name, link })
      .then(newCard => {
        setCardList([newCard, ...cardList])
        setIsAddPlaceOpen(false)
      })
      .catch(err => console.error(`Unable to add card: ${err}. Check link and try again.`))
  }

  // Send a card like to server, then replace with modified card in card list
  function handleCardLike(card) {
    const isLiked = card.likes.some(i => i._id === currentUser._id)

    api.changeLikeCardStatus(card._id, !isLiked)
      .then(newCard => {
        setCardList((state) => state.map((c) => c._id === card._id ? newCard : c))
      })
      .catch(err => console.error(`Unable to update like status: ${err}`))
  }

  // Delete a card from server, then remove from card list and close trash modal
  function handleCardDelete() {
    api.trashCard(selectedCard._id)
      .then(() => setCardList( cardList.filter(cards => cards._id !== selectedCard._id) ))
      .then(() => setSelectedCard({}))
      .then(() => setIsConfirmTrashOpen(false))
      .catch(err => console.error(`Unable to delete card: ${err}`))
  }

  // Open trash modal for selected card
  function handleTrash(card) {
    setSelectedCard(card)
    setIsConfirmTrashOpen(true)
  }

  // Define close modal function for all modals
  function closeAllPopups() {
    setIsEditAvatarOpen(false)
    setIsEditProfileOpen(false)
    setIsAddPlaceOpen(false)
    setIsConfirmTrashOpen(false)
    setIsPreviewOpen(false)
    setIsInfoToolTipOpen(false)
    setSelectedCard({})
    setInfoStatus({})
  }

  // HTML for landing page
  return (
    <>
      <CurrentUserContext.Provider value={currentUser}>
        <Header isLoggedIn={isLoggedIn} email={email} onSignOut={onSignOut} />
        <Switch>
          <ProtectedRoute 
              exact path='/'
              component={Main} 
              isLoggedIn={isLoggedIn}
              onEditProfileClick={handleEditProfileClick}
              onAddPlaceClick={handleAddPlaceClick} 
              onEditAvatarClick={handleEditAvatarClick}
              onCardClick={handleCardClick}
              cards={cardList}
              onCardLike={handleCardLike}
              onCardDelete={handleTrash}
            />
          <Route path='/signup'>
            <Register onRegister={onRegister} email={email} />
          </Route>
          <Route path='/signin'>
            <Login onLogin={onLogin} email={email} />
          </Route>
        </Switch>
        <Footer />
        <EditAvatarPopup isOpen={isEditAvatarOpen} onClose={closeAllPopups} onUpdateAvatar={handleUpdateAvatar} />
        <EditProfilePopup isOpen={isEditProfileOpen} onClose={closeAllPopups} onUpdateUser={handleUpdateUser} />
        <AddPlacePopup isOpen={isAddPlaceOpen} onClose={closeAllPopups} onUpdateCards={handleAddPlaceSubmit}/>
        <TrashPopup isOpen={isConfirmTrashOpen} onClose={closeAllPopups} onUpdateTrash={handleCardDelete} />
      </CurrentUserContext.Provider>
      <InfoTooltip isOpen={isInfoToolTipOpen} onClose={closeAllPopups} status={toolTipStatus} />
      <ImagePopup isOpen={isPreviewOpen} onClose={closeAllPopups} card={selectedCard} />
    </>
  )
}

export default App
